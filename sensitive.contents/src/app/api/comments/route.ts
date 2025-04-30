import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/[...nextauth]/authOptions";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

export async function POST(req: NextRequest) {
  // 세션에서 userId 추출
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "누구세요?" }, { status: 401 });
  }
  const userId = session.user.id;

  // userId로 rate limit 체크
  const { success } = await ratelimit.limit(userId);

  if (!success) {
    return NextResponse.json({ error: "댓글 작성 횟수가 초과되었습니다. 잠시 후에 다시 시도해주세요." }, { status: 429 });
  }

  const { postId, text, parentId } = await req.json();
  if (!postId || !text) {
    return NextResponse.json({ error: 'postId, text required' }, { status: 400 });
  }
  if (!session.user.id) {
    return NextResponse.json({ error: 'user.id missing in session' }, { status: 500 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId: session.user.id,
      text,
      parentId: parentId || null,
    },
    include: { user: true },
  });
  return NextResponse.json(comment);
}

// 댓글 삭제
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
  return NextResponse.json({ ok: true });
}

// 댓글 수정
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
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
