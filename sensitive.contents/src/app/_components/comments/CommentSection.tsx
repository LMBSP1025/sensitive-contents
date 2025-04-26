'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useEffect, useState, FormEvent } from 'react';

// 인스타그램 프로필 타입 정의
interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  profile_picture_url?: string;
}

// 파일 상단에 인터페이스 추가
interface FacebookPage {
  instagram_business_account?: InstagramProfile;
  [key: string]: any;
}

// Session 타입 확장
declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}

export default function CommentSection() {
  const { data: session, status } = useSession();
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfile | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Facebook 인증 후 Instagram 계정 정보 가져오기
  useEffect(() => {
    async function fetchInstagramProfile() {
      if (session?.accessToken) {
        try {
          setLoading(true);
          
          // 1단계: 페이지 목록 가져오기
          const pagesResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${session.accessToken}`
          );
          const pagesData = await pagesResponse.json();
          
          if (pagesData.data && pagesData.data.length > 0) {
            // 2단계: 페이지 ID로 인스타그램 비즈니스 계정 정보 가져오기
            const pageId = pagesData.data[0].id;
            const igResponse = await fetch(
              `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account{id,name,username,profile_picture_url}&access_token=${session.accessToken}`
            );
            const igData = await igResponse.json();
            
            if (igData.instagram_business_account) {
              setInstagramProfile(igData.instagram_business_account);
              console.log("인스타그램 계정 정보:", igData.instagram_business_account);
            }
          }
        } catch (error) {
          console.error('Instagram 계정 정보 가져오기 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchInstagramProfile();
  }, [session]);

  // 댓글 제출 함수
  const handleSubmitComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    // 여기에 댓글 저장 로직 추가
    console.log('댓글 작성:', comment);
    console.log('작성자:', instagramProfile ? instagramProfile.username : session?.user?.name);
    
    // 댓글 작성 후 폼 초기화
    setComment('');
  };

  if (status === "loading" || loading) {
    return <div className="my-8 p-4">로딩중...</div>;
  }

  // 로그인되지 않은 경우
  if (!session) {
    return (
      <div className="my-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <p className="mb-4 text-gray-600 dark:text-gray-300">댓글을 작성하려면 인스타그램 계정으로 로그인이 필요합니다.</p>
        <button
          onClick={() => signIn('email', { 
            callbackUrl: window.location.href,
            redirect: true
          })}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          이메일로 로그인
        </button>
      </div>
    );
  }
  
  // 로그인은 되었지만 Instagram 계정이 없는 경우
  if (!instagramProfile) {
    return (
      <div className="my-8 p-4 bg-yellow-50 dark:bg-amber-900 rounded-lg">
        <p className="mb-4 text-amber-800 dark:text-amber-200">
          인스타그램 비즈니스 계정이 연결되어 있지 않습니다. 인스타그램 비즈니스 계정을 Facebook에 연결하거나 다시 로그인해주세요.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: window.location.href })}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
        >
          로그아웃
        </button>
      </div>
    );
  }

  // 로그인 및 Instagram 계정이 있는 경우
  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center">
          {instagramProfile.profile_picture_url ? (
            <Image
              src={instagramProfile.profile_picture_url}
              alt={instagramProfile.username || '인스타그램 프로필'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : session.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || '프로필 이미지'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : null}
          <span className="ml-3 font-medium">
            {instagramProfile.username ? (
              <>
                <span className="text-xs text-gray-400">@</span>
                {instagramProfile.username}
              </>
            ) : session.user?.name}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: window.location.href })}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
        >
          로그아웃
        </button>
      </div>
      
      <form onSubmit={handleSubmitComment} className="mt-4">
        <textarea
          placeholder="댓글을 작성해주세요..."
          className="w-full p-4 border dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
        <button
          type="submit"
          className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          댓글 작성
        </button>
      </form>
    </div>
  );
}