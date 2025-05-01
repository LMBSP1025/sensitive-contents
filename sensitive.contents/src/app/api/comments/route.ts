import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Session, DefaultSession } from 'next-auth';

const rateLimitMap = new Map<string, { count: number; last: number }>();
const RATE_LIMIT = 5; // 1분에 5회
const WINDOW_MS = 60 * 1000; // 1분

// Upstash Redis 연결 (환경변수로 관리 권장)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 1분에 5회 제한 (슬라이딩 윈도우)
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true, // 디버깅을 위한 분석 활성화
  prefix: "comments_ratelimit", // 레이트 리밋 키 접두사 추가
});

function checkRateLimit(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, last: now };
  if (now - entry.last > WINDOW_MS) {
    // 윈도우 리셋
    rateLimitMap.set(ip, { count: 1, last: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT) {
    return true; // 제한 초과
  }
  rateLimitMap.set(ip, { count: entry.count + 1, last: entry.last });
  return false;
}

// CORS 헤더 설정 함수 추가
function corsHeaders() {
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  };
}

interface CustomSession extends Session {
  user?: DefaultSession["user"] & {
    id: string;
  };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const postId = url.searchParams.get('postId');
  const comments = await prisma.comment.findMany({
    where: { postId: postId || undefined },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
  return NextResponse.json(comments);
}

// OPTIONS 메서드 추가 (CORS preflight 요청 처리)
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "인증이 필요합니다." }, 
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }

    const userId = session.user.id;
    const { success } = await ratelimit.limit(userId);

    if (!success) {
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." }, 
        { status: 429, headers: corsHeaders() }
      );
    }

    const body = await req.json();
    const { postId, text, parentId } = body;
    console.log('Request body:', { postId, text, parentId }); // 디버깅용

    if (!postId || !text) {
      return NextResponse.json(
        { error: '필수 입력값이 누락되었습니다.' }, 
        { status: 400, headers: corsHeaders() }
      );
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
    console.error('Comment creation error:', error); // 디버깅용
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다." }, 
      { status: 500, headers: corsHeaders() }
    );
  }
}

// 댓글 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as Session;
  if (!session?.user) {
    return NextResponse.json(
      { error: "인증이 필요합니다." }, 
      { status: 401, headers: corsHeaders() }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // 본인 댓글만 삭제 가능
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.userId !== session.user.id) {
    return NextResponse.json({ error: "떽!" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true }, { headers: corsHeaders() });
}

// 댓글 수정
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as Session;
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, text } = await req.json();
  if (!id || !text) {
    return NextResponse.json({ error: "id, text required" }, { status: 400 });
  }

  // 본인 댓글만 수정 가능
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment || comment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { text },
    include: { user: true },
  });
  return NextResponse.json(updated);
}
