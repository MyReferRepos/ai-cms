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
 * 评论创建请求的验证 schema
 */
const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  content: z.string().min(2, 'Comment must be at least 2 characters').max(5000, 'Comment is too long'),
  // 反垃圾字段
  honeypot: z.string().optional(), // 应该为空
  timestamp: z.number().optional(), // 表单生成时间
});

/**
 * POST /api/comments
 * 创建新评论（带反垃圾保护）
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户认证
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to comment' },
        { status: 401 }
      );
    }

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

    const { postId, content, honeypot, timestamp } = validationResult.data;

    // ===== 反垃圾检查 =====
    const clientIP = getClientIP(request);
    const identifier = `${clientIP}:${session.user.id}`;

    const antiSpamResult = performAntiSpamCheck({
      identifier,
      content,
      honeypot,
      timestamp,
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
    // 默认情况下，评论需要审核（approved: false）
    // 管理员的评论可以自动批准
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const autoApprove = user?.role === 'ADMIN';

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: session.user.id,
        approved: autoApprove,
      },
      include: {
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
      `[Comment] New comment created by ${session.user.email} on post ${postId}` +
        (autoApprove ? ' (auto-approved)' : ' (pending approval)')
    );

    return NextResponse.json(
      {
        comment,
        message: autoApprove
          ? 'Comment published successfully'
          : 'Comment submitted and pending approval',
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

    return NextResponse.json({
      comments,
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
