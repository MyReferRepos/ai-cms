import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CommentsTable from '@/components/admin/comments-table';

export const metadata = {
  title: 'Comments Management | AI CMS',
  description: 'Manage and moderate comments',
};

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // 权限检查：只有 ADMIN 和 EDITOR 可以访问
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'EDITOR') {
    redirect('/admin');
  }

  // 构建查询条件
  const status = searchParams.status || 'all';
  const where: any = {};

  if (status === 'pending') {
    where.approved = false;
  } else if (status === 'approved') {
    where.approved = true;
  }
  // 'all' 则不添加条件

  // 获取评论
  const comments = await prisma.comment.findMany({
    where,
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
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 获取统计数据
  const stats = await prisma.comment.groupBy({
    by: ['approved'],
    _count: true,
  });

  const pendingCount =
    stats.find((s) => s.approved === false)?._count || 0;
  const approvedCount =
    stats.find((s) => s.approved === true)?._count || 0;
  const totalCount = pendingCount + approvedCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Comments Management
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Moderate and manage user comments
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Approval
              </p>
              <p className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-500">
                {pendingCount}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg
                className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-500">
                {approvedCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Comments
              </p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-500">
                {totalCount}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg
                className="w-8 h-8 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 评论表格 */}
      <CommentsTable comments={comments} currentStatus={status} />
    </div>
  );
}
