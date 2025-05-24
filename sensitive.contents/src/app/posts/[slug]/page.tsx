// sensitive.contents/src/app/posts/[slug]/page.tsx
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts } from "@/lib/api";
import { CMS_NAME } from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";
import Alert from "@/app/_components/alert";
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import Footer from "@/app/_components/footer"; // Footer 컴포넌트 추가
import ThreeCanvas from "@/app/_components/three-canvas"; // ThreeCanvas 컴포넌트 추가
import dynamic from 'next/dynamic';
import DateFormatter from "@/app/_components/date-formatter";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import PostClient from './PostClient';
import type { Post } from '@/interfaces/post';

// 클라이언트 컴포넌트를 동적으로 불러옴
const CommentSection = dynamic(() => import('@/app/_components/comments/CommentSection'), {
  ssr: false
});

export default async function Post({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return notFound();

  let content = post.content;
  let isHtml = (post as any).isHtml || false;

  if (isHtml) {
    const bodyStart = content.indexOf("<body>");
    const bodyEnd = content.indexOf("</body>");
    if (bodyStart !== -1 && bodyEnd !== -1) {
      content = content.substring(bodyStart + 6, bodyEnd).trim();
    }
  } else {
    content = await markdownToHtml(post.content || "", isHtml);
  }

  return <PostClient post={{...post, id: post.slug}} content={content} />;
}

type Comment = {
  text: string;
};

type Params = {
  params: {
    slug: string;
  };
};

export function generateMetadata({ params }: Params): Metadata {
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const title = `${post.title} / sensitive.contents`;

  // Check if ogImage and url exist before accessing them
  const images = post.ogImage?.url ? [post.ogImage.url] : [];

  return {
    title,
    openGraph: {
      title,
      images,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts(); // Ensure this function is asynchronous

  return posts.map((post) => ({
    slug: post.slug,
  }));
}