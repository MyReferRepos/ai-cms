'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface Comment {
  id: string;
  content: string;
  createdAt: Date | string;
  author?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  guestName?: string | null;
  guestEmail?: string | null;
  displayName?: string;
  displayImage?: string | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
}

export default function CommentSection({
  postId,
  initialComments = [],
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [honeypot, setHoneypot] = useState(''); // 反垃圾字段
  const [timestamp] = useState(Date.now()); // 表单生成时间
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // 当前正在回复的评论ID

  const isAnonymous = !session;

  // 加载评论
  const loadComments = async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  useEffect(() => {
    loadComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // 验证表单
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (isAnonymous && !guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody: any = {
        postId,
        content: content.trim(),
        honeypot, // 应该为空
        timestamp, // 表单生成时间
      };

      // 如果是回复，添加parentId
      if (parentId) {
        requestBody.parentId = parentId;
      }

      // 如果是匿名用户，添加访客信息
      if (isAnonymous) {
        requestBody.guestName = guestName.trim();
        if (guestEmail.trim()) {
          requestBody.guestEmail = guestEmail.trim();
        }
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setContent('');
        setReplyingTo(null); // 清除回复状态
        if (isAnonymous) {
          // 匿名用户保留姓名和邮箱以便下次使用
          // setGuestName('');
          // setGuestEmail('');
        }
        setSuccessMessage(
          data.message || 'Comment submitted successfully!'
        );

        // 如果评论自动批准，刷新评论列表
        if (data.comment?.approved) {
          loadComments();
        }
      } else {
        // 处理错误
        if (response.status === 429) {
          setError(
            `Too many requests. Please try again in ${
              data.retryAfter || 60
            } seconds.`
          );
        } else {
          setError(data.reason || data.error || 'Failed to submit comment');
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayName = (comment: Comment) => {
    if (comment.displayName) return comment.displayName;
    if (comment.author?.name) return comment.author.name;
    if (comment.guestName) return comment.guestName;
    return 'Anonymous';
  };

  const getDisplayImage = (comment: Comment) => {
    if (comment.displayImage) return comment.displayImage;
    if (comment.author?.image) return comment.author.image;
    return null;
  };

  // 递归渲染评论（支持嵌套回复）
  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const displayName = getDisplayName(comment);
    const displayImage = getDisplayImage(comment);
    const isReplyingToThis = replyingTo === comment.id;
    const maxDepth = 3; // 最大嵌套深度

    return (
      <div className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-4">
            {/* 用户头像 */}
            <div className="flex-shrink-0">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {displayName[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* 评论内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </h4>
                  {comment.guestName && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (Guest)
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </p>

              {/* 回复按钮 */}
              {depth < maxDepth && (
                <div className="mt-3">
                  <button
                    onClick={() => setReplyingTo(isReplyingToThis ? null : comment.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {isReplyingToThis ? 'Cancel' : 'Reply'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 回复表单 */}
        {isReplyingToThis && (
          <div className="ml-8 mt-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="space-y-3">
              {/* 匿名用户需要填写姓名和邮箱 */}
              {isAnonymous && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="Your name"
                      maxLength={50}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                      placeholder="your@email.com"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reply to {displayName}
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                  placeholder="Write your reply..."
                  maxLength={5000}
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {content.length} / 5000 characters
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Reply'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 递归渲染回复 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12 space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Comments ({comments.length})
      </h2>

      {/* 评论表单 */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 匿名用户需要填写姓名和邮箱 */}
        {isAnonymous && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="guest-name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="guest-name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="Your name"
                maxLength={50}
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <label
                htmlFor="guest-email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email (optional)
              </label>
              <input
                type="email"
                id="guest-email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email won&apos;t be publicly displayed
              </p>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="comment-content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {isAnonymous ? 'Your comment' : 'Add a comment'}
          </label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            placeholder="Share your thoughts..."
            maxLength={5000}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {content.length} / 5000 characters
            {isAnonymous && ' • Anonymous comments require approval before being displayed'}
          </p>
        </div>

        {/* Honeypot 字段 - 隐藏，机器人会填充 */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />

        {/* 错误和成功消息 */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
            {successMessage}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            {isAnonymous && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Want to comment without approval?{' '}
                <a
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Login
                </a>
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Comment'}
          </Button>
        </div>
      </form>

      {/* 评论列表 */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
