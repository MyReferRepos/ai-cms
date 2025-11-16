import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  performAntiSpamCheck,
  getClientIP,
} from '@/lib/anti-spam';

/**
 * 评论创建请求的验证 schema（支持匿名评论）
 */
const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  content: z.string().min(2, 'Comment must be at least 2 characters').max(5000, 'Comment is too long'),
  // For anonymous users
  guestName: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
  // 反垃圾字段
  honeypot: z.string().optional(), // 应该为空
  timestamp: z.number().optional(), // 表单生成时间
});

/**
 * POST /api/comments
 * 创建新评论（支持匿名评论+反垃圾保护）
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户认证状态
    const session = await getServerSession(authOptions);
    const isAnonymous = !session?.user?.id;

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { postId, content, guestName, guestEmail, honeypot, timestamp } = validationResult.data;

    // ===== 反垃圾检查 =====
    const clientIP = getClientIP(request);
    const identifier = isAnonymous
      ? `anon:${clientIP}`
      : `${clientIP}:${session.user.id}`;

    const antiSpamResult = performAntiSpamCheck({
      identifier,
      content,
      honeypot,
      timestamp,
      isAnonymous,
      guestName,
      guestEmail,
    });

    if (!antiSpamResult.passed) {
      console.warn(`[Anti-Spam] Blocked comment from ${identifier}: ${antiSpamResult.reason}`);

      const statusCode = antiSpamResult.retryAfter ? 429 : 403;
      const response: any = {
        error: 'Comment rejected',
        reason: antiSpamResult.reason || 'Spam detected',
      };

      if (antiSpamResult.retryAfter) {
        response.retryAfter = antiSpamResult.retryAfter;
      }

      return NextResponse.json(response, {
        status: statusCode,
        headers: antiSpamResult.retryAfter
          ? { 'Retry-After': String(antiSpamResult.retryAfter) }
          : undefined,
      });
    }

    // ===== 验证文章是否存在 =====
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, status: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 只允许在已发布的文章上评论
    if (post.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot comment on unpublished posts' },
        { status: 403 }
      );
    }

    // ===== 创建评论 =====
    let autoApprove = false;

    // 检查是否自动批准
    if (!isAnonymous) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      autoApprove = user?.role === 'ADMIN';
    }
    // 匿名评论始终需要审核

    // 准备评论数据
    const commentData: any = {
      content,
      postId,
      approved: autoApprove,
    };

    if (isAnonymous) {
      // 匿名评论
      commentData.guestName = guestName;
      commentData.guestEmail = guestEmail || null;
    } else {
      // 已登录用户评论
      commentData.authorId = session.user.id;
    }

    const comment = await prisma.comment.create({
      data: commentData,
      include: isAnonymous
        ? undefined
        : {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
    });

    console.info(
      `[Comment] New ${isAnonymous ? 'anonymous' : 'registered'} comment created` +
        ` on post ${postId}` +
        (autoApprove ? ' (auto-approved)' : ' (pending approval)')
    );

    return NextResponse.json(
      {
        comment,
        message: autoApprove
          ? 'Comment published successfully'
          : 'Comment submitted and pending approval. Thank you!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Comment POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/comments?postId=xxx&includeUnapproved=false
 * 获取评论列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const includeUnapproved = searchParams.get('includeUnapproved') === 'true';

    // 如果要包含未审核的评论，需要管理员权限
    if (includeUnapproved) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
    }

    // 构建查询条件
    const where: any = {};

    if (postId) {
      where.postId = postId;
    }

    if (!includeUnapproved) {
      where.approved = true;
    }

    // 获取评论
    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 处理评论数据，统一格式（包含匿名和注册用户）
    const processedComments = comments.map((comment) => ({
      ...comment,
      displayName: comment.author?.name || comment.guestName || 'Anonymous',
      displayImage: comment.author?.image || null,
    }));

    return NextResponse.json({
      comments: processedComments,
      total: comments.length,
    });
  } catch (error) {
    console.error('[Comment GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
