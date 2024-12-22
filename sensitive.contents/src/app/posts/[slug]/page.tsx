// sensitive.contents/src/app/posts/[slug]/page.tsx
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

  console.log("로드된 포스트:", post); // 콘솔 로그 추가

  let content = post.content;
  let isHtml = post.isHtml || false;

  if (isHtml) {
    // HTML 파일인 경우 markdownToHtml을 건너뛰고 직접 사용
    // <body> 태그 안의 내용만 추출
    const bodyMatch = content.match(/<body>(.*?)<\/body>/s);
    if (bodyMatch && bodyMatch[1]) {
      content = bodyMatch[1].trim();
    }
  } else {
    // Markdown 파일인 경우 markdownToHtml을 사용
    content = await markdownToHtml(post.content || "", isHtml);
  }
  console.log("변환된 내용:\n", content); // 콘솔 로그 추가

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
  isHtml?: boolean;
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