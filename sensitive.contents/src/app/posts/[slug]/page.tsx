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

export default async function Post({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug) as Post;
  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");
  return (
    <main>
      <Container>
        <Header />
        <article className="mb-32">
          <PostHeader
            title={post.title}
            coverImage={post.coverImage}
            date={post.date}
          />
          <PostBody content={content} />
        </article>
      </Container>
      <Footer audioId={post.audioId || ''} audioTitle={post.audioTitle || ''} audioAuthor={post.audioAuthor || ''} isList={post.isList || false}></Footer>
    </main>
  );
}

type Post = {
  audioId?: string;
  audioTitle?: string;
  audioAuthor?: string;
  isList?: boolean;
} & {
  [key: string]: any;
};

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

  return {
    title,
    openGraph: {
      title,
      images: [post.ogImage.url],
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts(); // Ensure this function is asynchronous

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
