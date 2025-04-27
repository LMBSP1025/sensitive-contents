'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signIn('email', {
      email,
      callbackUrl: '/auth/verify-request',
      redirect: true,
    });
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">이메일로 로그인</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            로그인 링크를 받을 이메일 주소를 입력하세요
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {isLoading ? '로딩 중...' : '로그인 링크 받기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
