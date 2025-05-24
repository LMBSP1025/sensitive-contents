import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// 게시글 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.email !== process.env.ALLOWED_EMAIL) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { title, content } = await req.json();
    const filePath = path.join(process.cwd(), '_posts', `${params.slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      return new Response('Post not found', { status: 404 });
    }

    const frontmatter = matter.stringify(content, { title });
    fs.writeFileSync(filePath, frontmatter);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 게시글 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.email !== process.env.ALLOWED_EMAIL) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const filePath = path.join(process.cwd(), '_posts', `${params.slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      return new Response('Post not found', { status: 404 });
    }

    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
