// markdownToHtml.ts
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";

export default async function markdownToHtml(markdown: string, isHtml: boolean = false) {
  console.log("Markdown 입력:\n", markdown); // 콘솔 로그 추가

  if (isHtml) {
    // 이미 HTML이라면 그대로 반환
    return markdown;
  }

  const processor = remark().use(gfm).use(html);
  const vfile = await processor.process(markdown);
  
  // 중간 단계에서 결과 출력
  console.log("AST 출력:\n", vfile.data.astro);
  console.log("HTML 출력:\n", vfile.toString());
  
  return vfile.toString();
}