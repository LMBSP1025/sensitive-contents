import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Session, DefaultSession } from 'next-auth';
import { AuthOptions } from "next-auth";

// Types
interface CustomSession extends Session {
  user?: DefaultSession["user"] & {
    id: string;
  };
}

interface CommentData {
  postId: string;
  text: string;
  parentId?: string;
}

// Constants
const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 1000;

// Redis setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(RATE_LIMIT, "1 m"),
  analytics: true,
  prefix: "comments_ratelimit",
});

// Utility functions
function corsHeaders() {
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  };
}

async function getSession(): Promise<CustomSession | null> {
  try {
    const session = await getServerSession(authOptions as AuthOptions);
    console.log('Session data:', session); // 세션 데이터 로깅
    return session as CustomSession;
  } catch (error) {
    console.error('Session error:', error); // 세션 에러 로깅
    return null;
  }
}

function createErrorResponse(message: string, status: number, error?: any) {
  console.error('API Error:', {
    message,
    status,
    error: error instanceof Error ? error.message : error
  });
  
  return NextResponse.json(
    { 
      error: message,
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined 
    },
    { status, headers: corsHeaders() }
  );
}

// API Handlers
export async function GET(req: NextRequest) {
  try {
  const url = new URL(req.url);
  const postId = url.searchParams.get('postId');
    
  const comments = await prisma.comment.findMany({
    where: { postId: postId || undefined },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
    
    return NextResponse.json(comments, { headers: corsHeaders() });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return createErrorResponse('댓글을 불러오는 중 오류가 발생했습니다.', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions as AuthOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      console.log('No session or user ID');
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    // 2. 요청 본문 파싱
    let body;
    try {
      body = await req.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return createErrorResponse('잘못된 요청 형식입니다.', 400);
    }

    const { postId, text, parentId } = body;

    // 3. 입력값 검증
    if (!postId || !text) {
      console.log('Missing required fields:', { postId, text });
      return createErrorResponse('필수 입력값이 누락되었습니다.', 400);
    }

    // 4. 댓글 생성
    try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: session.user.id,
        text,
        parentId: parentId || null,
      },
      include: { 
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        } 
      },
    });
      console.log('Created comment:', JSON.stringify(comment, null, 2));
    return NextResponse.json(comment, { headers: corsHeaders() });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return createErrorResponse('데이터베이스 오류가 발생했습니다.', 500, dbError);
    }
  } catch (error) {
    console.error('Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return createErrorResponse('댓글 작성 중 오류가 발생했습니다.', 500, error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
    
  if (!id) {
      return createErrorResponse('댓글 ID가 필요합니다.', 400);
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
    
  if (!comment || comment.userId !== session.user.id) {
      return createErrorResponse('삭제 권한이 없습니다.', 403);
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Comment deletion error:', error);
    return createErrorResponse('댓글 삭제 중 오류가 발생했습니다.', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
  }

  const { id, text } = await req.json();
    
  if (!id || !text) {
      return createErrorResponse('댓글 ID와 내용이 필요합니다.', 400);
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
    
  if (!comment || comment.userId !== session.user.id) {
      return createErrorResponse('수정 권한이 없습니다.', 403);
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { text },
    include: { user: true },
  });
    
    return NextResponse.json(updated, { headers: corsHeaders() });
  } catch (error) {
    console.error('Comment update error:', error);
    return createErrorResponse('댓글 수정 중 오류가 발생했습니다.', 500);
  }
}
