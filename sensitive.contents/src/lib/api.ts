// sensitive.contents/src/lib/api.ts
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
    const metadataStart = fileContents.indexOf('<script type="application/json" id="post-metadata">');
    const metadataEnd = fileContents.indexOf('</script>', metadataStart);

    if (metadataStart !== -1 && metadataEnd !== -1) {
      try {
        const metadataJson = fileContents.substring(metadataStart + 45, metadataEnd);
        data = JSON.parse(metadataJson);
        // 메타데이터를 제거한 나머지 내용 추출
        content = fileContents.substring(metadataEnd + 9).trim();
        // <body> 태그 안의 내용만 추출
        const bodyStart = content.indexOf('<body>');
        const bodyEnd = content.indexOf('</body>');

        if (bodyStart !== -1 && bodyEnd !== -1) {
          content = content.substring(bodyStart + 6, bodyEnd).trim();
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