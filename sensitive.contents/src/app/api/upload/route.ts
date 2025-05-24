import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // 인증 체크
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 권한 체크
    if (session.user?.email !== process.env.ALLOWED_EMAIL) {
      return new Response('Forbidden', { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return new Response('Invalid file type', { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new Response('File too large', { status: 400 });
    }

    // 안전한 파일명 생성
    const fileExtension = path.extname(file.name);
    const safeFileName = crypto.randomBytes(16).toString('hex') + fileExtension;
    
    // 업로드 디렉토리 경로
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, safeFileName);

    // 디렉토리 존재 확인 및 생성
    await mkdir(uploadDir, { recursive: true });

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return new Response(JSON.stringify({ url: `/uploads/${safeFileName}` }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
