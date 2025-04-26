'use client';

import { signIn } from 'next-auth/react';

export default function LoginTest() {
  return (
    <div style={{ margin: '30px', padding: '20px', background: '#f0f0f0' }}>
      <h3>로그인 테스트</h3>
      <button 
        onClick={() => signIn()} 
        style={{ padding: '10px', background: 'blue', color: 'white' }}
      >
        기본 로그인
      </button>
      <button 
        onClick={() => signIn('facebook')} 
        style={{ padding: '10px', marginLeft: '10px', background: '#1877F2', color: 'white' }}
      >
        Facebook 로그인
      </button>
    </div>
  );
}
