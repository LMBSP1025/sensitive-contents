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
  return await getServerSession(authOptions as AuthOptions) as CustomSession;
}

function createErrorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
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
    const session = await getSession();
    
    if (!session?.user?.id) {
      return createErrorResponse('인증이 필요합니다.', 401);
    }

    const { success } = await ratelimit.limit(session.user.id);
    if (!success) {
      return createErrorResponse('잠시 후 다시 시도해주세요.', 429);
    }

    const body = await req.json();
    const { postId, text, parentId }: CommentData = body;

    if (!postId || !text) {
      return createErrorResponse('필수 입력값이 누락되었습니다.', 400);
    }

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

    return NextResponse.json(comment, { headers: corsHeaders() });
  } catch (error) {
    console.error('Comment creation error:', error);
    return createErrorResponse(
      '댓글 작성 중 오류가 발생했습니다.',
      500
    );
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
