import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * 评论更新请求的验证 schema
 */
const updateCommentSchema = z.object({
  approved: z.boolean().optional(),
  content: z.string().min(2).max(5000).optional(),
});

/**
 * GET /api/comments/[id]
 * 获取单个评论详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 如果评论未审核，只有管理员或评论作者可以查看
    if (!comment.approved) {
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

      const isAuthor = comment.authorId === session.user.id;
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('[Comment GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments/[id]
 * 更新评论（主要用于审核）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const validationResult = updateCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { approved, content } = validationResult.data;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        authorId: true,
        approved: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 权限检查
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAuthor = comment.authorId === session.user.id;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    // 只有管理员可以审核评论
    if (approved !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Only admins can approve comments' },
        { status: 403 }
      );
    }

    // 只有作者或管理员可以编辑内容
    if (content !== undefined && !isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only edit your own comments' },
        { status: 403 }
      );
    }

    // 更新评论
    const updateData: any = {};
    if (approved !== undefined) {
      updateData.approved = approved;
    }
    if (content !== undefined) {
      updateData.content = content;
      // 如果内容被修改，可能需要重新审核
      if (isAuthor && !isAdmin) {
        updateData.approved = false;
      }
    }

    const updatedComment = await prisma.comment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.info(
      `[Comment] Updated comment ${params.id} by ${session.user.email}`
    );

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('[Comment PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * 删除评论
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 权限检查：只有评论作者或管理员可以删除
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isAuthor = comment.authorId === session.user.id;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'EDITOR';

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own comments' },
        { status: 403 }
      );
    }

    // 删除评论
    await prisma.comment.delete({
      where: { id: params.id },
    });

    console.info(
      `[Comment] Deleted comment ${params.id} by ${session.user.email}`
    );

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('[Comment DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
