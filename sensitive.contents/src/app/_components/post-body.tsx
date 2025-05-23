import markdownStyles from "./markdown-styles.module.css";
import ThreeCanvas from "@/app/_components/three-canvas";
import React from "react";

type Props = {
  content: string;
};

// 커스텀 태그 파싱 함수
function parseCustomTags(content: string) {
  // [THREE_CANVAS type="xxx"] 패턴
  const regex = /\[THREE_CANVAS(?: type="(.*?)")?\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    // 이전 일반 HTML 부분
    if (match.index > lastIndex) {
      const htmlPart = content.slice(lastIndex, match.index);
      parts.push(
        <div
          key={`html-${key++}`}
          className={markdownStyles["markdown"]}
          dangerouslySetInnerHTML={{ __html: htmlPart }}
        />
      );
    }
    // ThreeCanvas 컴포넌트 삽입
    const type = match[1] || "default";
    parts.push(
      <ThreeCanvas
        type={type}
        key={`canvas-${key++}`}
        style={{
          width: "100%",
          aspectRatio: "4/3",
          maxHeight: 500,
          minHeight: 200,
          display: "block",
          position: "relative"
        }}
      />
    );
    lastIndex = regex.lastIndex;
  }
  // 마지막 남은 일반 HTML 부분
  if (lastIndex < content.length) {
    const htmlPart = content.slice(lastIndex);
    parts.push(
      <div
        key={`html-${key++}`}
        className={markdownStyles["markdown"]}
        dangerouslySetInnerHTML={{ __html: htmlPart }}
      />
    );
  }
  return parts;
}

export function PostBody({ content }: Props) {
  return <div className="max-w-2xl mx-auto">{parseCustomTags(content)}</div>;
}
