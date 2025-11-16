'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  approved: boolean;
  createdAt: Date | string;
  author?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  guestName?: string | null;
  guestEmail?: string | null;
}

interface PostCommentsDialogProps {
  postId: string;
  postTitle: string;
  open: boolean;
  onClose: () => void;
}

export default function PostCommentsDialog({
  postId,
  postTitle,
  open,
  onClose,
}: PostCommentsDialogProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const limit = 10;

  const loadComments = async () => {
    if (!open) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/posts/${postId}/comments?page=${page}&limit=${limit}`
      );

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setPage(1);
      loadComments();
    }
  }, [open, postId]);

  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [page]);

  const handleApprove = async (commentId: string) => {
    setProcessingId(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        loadComments();
        router.refresh();
      } else {
        alert('Failed to approve comment');
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
        loadComments();
        router.refresh();
      } else {
        alert('Failed to reject comment');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setProcessingId(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadComments();
        router.refresh();
      } else {
        alert('Failed to delete comment');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const getDisplayName = (comment: Comment) => {
    if (comment.author?.name) return comment.author.name;
    if (comment.author?.email) return comment.author.email;
    if (comment.guestName) return comment.guestName;
    return 'Anonymous';
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Comments on "${postTitle}"`} size="xl">
      <div className="space-y-4">
        {/* 统计信息 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total: <span className="font-semibold text-gray-900 dark:text-white">{total}</span> comments
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages || 1}
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading comments...</p>
          </div>
        )}

        {/* 评论列表 */}
        {!loading && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet for this post.
          </div>
        )}

        {!loading && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  {/* 评论内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {comment.author?.image && (
                          <img
                            src={comment.author.image}
                            alt={getDisplayName(comment)}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {getDisplayName(comment)}
                            {comment.guestName && (
                              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                                (Guest)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* 状态 */}
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          comment.approved
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {comment.approved ? 'Approved' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 whitespace-pre-wrap">
                      {comment.content}
                    </p>

                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.createdAt)}
                      {comment.guestEmail && ` • ${comment.guestEmail}`}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col space-y-1 ml-4">
                    {!comment.approved && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(comment.id)}
                        disabled={processingId === comment.id}
                        className="bg-green-600 hover:bg-green-700 text-xs"
                      >
                        Approve
                      </Button>
                    )}
                    {comment.approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(comment.id)}
                        disabled={processingId === comment.id}
                        className="text-xs"
                      >
                        Unapprove
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(comment.id)}
                      disabled={processingId === comment.id}
                      className="text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页控制 */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
