import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/posts/[id]/comments?page=1&limit=10
 * 获取指定文章的评论（带分页）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 检查权限
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

    if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR' && user?.role !== 'AUTHOR') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 获取分页参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // 检查文章是否存在
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // 获取评论总数
    const total = await prisma.comment.count({
      where: { postId: params.id },
    });

    // 获取分页评论
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
      post: {
        id: post.id,
        title: post.title,
      },
    });
  } catch (error) {
    console.error('[Post Comments GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
