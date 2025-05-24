'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Container from "@/app/_components/container";
import Header from "@/app/_components/header";
import { PostBody } from "@/app/_components/post-body";
import { PostHeader } from "@/app/_components/post-header";
import Footer from "@/app/_components/footer";
import ThreeCanvas from "@/app/_components/three-canvas";
import DateFormatter from "@/app/_components/date-formatter";
import dynamic from 'next/dynamic';

const CommentSection = dynamic(() => import('@/app/_components/comments/CommentSection'), {
  ssr: false
});

export default function PostClient({ post, content }: { post: Post, content: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAuthor = session?.user?.email === process.env.ALLOWED_EMAIL;

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const response = await fetch(`/api/posts/${post.slug}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <main>
      <Container>
        <Header />
        {post.showCanvas && <ThreeCanvas />}
        <article className="mb-32">
          {!post.showCanvas && (
            <PostHeader
              title={post.title}
              coverImage={post.coverImage}
              date={post.date}
              showCoverImage={post.showCover !== false}
            />
          )}
          <PostBody content={content} />
          <div className="mt-8 mb-4 text-gray-500">
            <DateFormatter dateString={post.date} />
          </div>
          {isAuthor && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push(`/editor/${post.slug}`)}
                className="px-4 py-2 border border-gray-400 text-gray-700 hover:bg-gray-50"
              >
                수정하기
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-400 text-red-700 hover:bg-red-50"
              >
                삭제하기
              </button>
            </div>
          )}
          {post.allowComments && <CommentSection postId={post.id} />}

        </article>
      </Container>
      <Footer 
        audioId={post.audioId || ''} 
        audioTitle={post.audioTitle || ''} 
        audioAuthor={post.audioAuthor || ''} 
        isList={post.isList || false}
      />
    </main>
  );
}

type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;
  content: string;
  coverImage: string;
  audioId?: string;
  audioTitle?: string;
  audioAuthor?: string;
  isList?: boolean;
  isHtml?: boolean;
  ogImage?: { url: string };
  showCanvas?: boolean;
  showCover?: boolean;
  allowComments?: boolean;
};
