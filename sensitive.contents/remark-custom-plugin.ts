// sensitive.contents/src/remark-custom-plugin.ts
import { visit } from 'unist-util-visit';
import { Node, Parent } from 'unist';

export default function customPlugin() {
  return (tree: Node) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === null) return;

      const noteRegex = /:::note\s*(.*?)\s*:::/gs;
      let match;
      let lastIndex = 0;
      const newChildren: Node[] = [];

      while ((match = noteRegex.exec(node.value)) !== null) {
        if (lastIndex < match.index) {
          newChildren.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index),
          });
        }

        // 캡처 그룹을 사용하여 내용을 추출
        const noteContent = match[1].trim();
        console.log('Captured note content:', noteContent); // 디버깅 로그 추가

        // 새로운 노드 생성
        newChildren.push({
          type: 'html',
          value: `<div class="note">${noteContent}</div>`,
        });

        lastIndex = noteRegex.lastIndex;
      }

      if (lastIndex < node.value.length) {
        newChildren.push({
          type: 'text',
          value: node.value.slice(lastIndex),
        });
      }

      if (newChildren.length > 0) {
        // 원래 노드를 새로운 노드들로 대체
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
}