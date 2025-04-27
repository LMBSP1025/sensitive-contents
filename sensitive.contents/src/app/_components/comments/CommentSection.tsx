'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import Image from 'next/image';

export default function CommentSection() {
  const { data: session, status } = useSession();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Array<{id: number, email: string, name: string, text: string, date: Date}>>([]);
  
  const handleSubmitComment = (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user) return;
    
    setComments([
      ...comments,
      {
        id: Date.now(),
        email: session.user.email || 'anonymous',
        name: session.user.name || '사용자',
        text: comment,
        date: new Date()
      }
    ]);
    setComment('');
  };
  
  if (status === "loading") {
    return <div className="my-8 p-4">로딩중...</div>;
  }
  
  if (!session) {
    return (
      <div className="my-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <p className="mb-4 text-gray-600 dark:text-gray-300">댓글을 작성하려면 로그인이 필요합니다.</p>
        <button
          onClick={() => signIn('email')}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          이메일로 로그인
        </button>
      </div>
    );
  }
  
  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center">
          {session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || '프로필'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
              {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
            </div>
          )}
          <span className="ml-3 font-medium">
            {session.user?.name || session.user?.email}
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmitComment} className="mt-4">
        <textarea
          placeholder="댓글을 작성해주세요..."
          className="w-full p-4 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-gray-100"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
        <button
          type="submit"
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          댓글 작성
        </button>
      </form>
      
      {comments.length > 0 && (
        <div className="mt-8">
          <h3 className="font-medium mb-4">댓글 {comments.length}개</h3>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm">
                    {comment.name.charAt(0)}
                  </div>
                  <span className="ml-2 font-medium">{comment.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {new Date(comment.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}