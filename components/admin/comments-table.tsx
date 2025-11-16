'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  approved: boolean;
  createdAt: Date;
  author?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  guestName?: string | null;
  guestEmail?: string | null;
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

interface CommentsTableProps {
  comments: Comment[];
  currentStatus: string;
}

export default function CommentsTable({
  comments,
  currentStatus,
}: CommentsTableProps) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (commentId: string) => {
    setProcessingId(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to approve comment');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (commentId: string) => {
    setProcessingId(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject comment');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    setProcessingId(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {currentStatus === 'pending'
              ? 'No pending comments to review.'
              : currentStatus === 'approved'
              ? 'No approved comments yet.'
              : 'No comments yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 过滤标签 */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-2">
          <Link href="/admin/comments?status=pending">
            <Button
              variant={currentStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
            >
              Pending
            </Button>
          </Link>
          <Link href="/admin/comments?status=approved">
            <Button
              variant={currentStatus === 'approved' ? 'default' : 'outline'}
              size="sm"
            >
              Approved
            </Button>
          </Link>
          <Link href="/admin/comments?status=all">
            <Button
              variant={currentStatus === 'all' ? 'default' : 'outline'}
              size="sm"
            >
              All
            </Button>
          </Link>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              {/* 左侧：评论内容 */}
              <div className="flex-1 min-w-0 pr-4">
                {/* 作者和状态 */}
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex items-center space-x-2">
                    {comment.author?.image && (
                      <img
                        src={comment.author.image}
                        alt={comment.author.name || ''}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {comment.author?.name || comment.author?.email || comment.guestName || 'Anonymous'}
                        {comment.guestName && (
                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                            (Guest)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(comment.createdAt)}
                        {comment.guestEmail && ` • ${comment.guestEmail}`}
                      </p>
                    </div>
                  </div>

                  {/* 状态徽章 */}
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      comment.approved
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {comment.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                {/* 评论内容 */}
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* 所属文章 */}
                <Link
                  href={`/admin/posts/${comment.post.id}/edit`}
                  className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {comment.post.title}
                </Link>
              </div>

              {/* 右侧：操作按钮 */}
              <div className="flex flex-col space-y-2">
                {!comment.approved && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleApprove(comment.id)}
                    disabled={processingId === comment.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === comment.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Approve
                      </>
                    )}
                  </Button>
                )}

                {comment.approved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(comment.id)}
                    disabled={processingId === comment.id}
                  >
                    {processingId === comment.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Unapprove
                      </>
                    )}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(comment.id)}
                  disabled={processingId === comment.id}
                >
                  {processingId === comment.id ? (
                    'Deleting...'
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
