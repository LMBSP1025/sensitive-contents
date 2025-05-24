import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sanitizeHtml from 'sanitize-html';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 인증 체크
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 권한 체크
  if (session.user?.email !== process.env.ALLOWED_EMAIL) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { title, content, coverImage } = await req.json();
    
    // 입력값 검증
    if (!title || !content) {
      return new Response('Bad Request', { status: 400 });
    }

    // XSS 방지를 위한 입력값 sanitize
    const sanitizedTitle = sanitizeHtml(title);
    const sanitizedContent = sanitizeHtml(content);

    // slug 생성 (제목을 기반으로)
    const slug = sanitizedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 파일 경로 설정
    const postsDirectory = path.join(process.cwd(), '_posts');
    const filePath = path.join(postsDirectory, `${slug}.md`);

    // 파일 저장
    fs.writeFileSync(filePath, sanitizedContent);

    return NextResponse.json({ slug });
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
