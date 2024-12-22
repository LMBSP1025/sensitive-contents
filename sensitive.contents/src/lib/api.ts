import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "").replace(/\.html$/, "");
  const mdPath = join(postsDirectory, `${realSlug}.md`);
  const htmlPath = join(postsDirectory, `${realSlug}.html`);

  let fileContents = "";
  let isMarkdown = false;

  if (fs.existsSync(mdPath)) {
    fileContents = fs.readFileSync(mdPath, "utf8");
    isMarkdown = true;
  } else if (fs.existsSync(htmlPath)) {
    fileContents = fs.readFileSync(htmlPath, "utf8");
  } else {
    throw new Error(`Post with slug ${slug} not found`);
  }

  let data = {};
  let content = fileContents;

  if (isMarkdown) {
    const { data: frontMatter, content: markdownContent } = matter(fileContents);
    data = frontMatter;
    content = markdownContent;
  } else {
    // HTML 파일에서 메타데이터 추출
    const metadataMatch = fileContents.match(/<script type="application\/json" id="post-metadata">(.*?)<\/script>/s);
    if (metadataMatch && metadataMatch[1]) {
      try {
        data = JSON.parse(metadataMatch[1]);
        // 메타데이터를 제거한 나머지 내용 추출
        content = fileContents.replace(metadataMatch[0], "").trim();
        // <body> 태그 안의 내용만 추출
        const bodyMatch = content.match(/<body>(.*?)<\/body>/s);
        if (bodyMatch && bodyMatch[1]) {
          content = bodyMatch[1].trim();
        }
      } catch (error) {
        console.error("Failed to parse metadata from HTML:", error);
      }
    }
  }

  return { ...data, slug: realSlug, content } as Post;
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}