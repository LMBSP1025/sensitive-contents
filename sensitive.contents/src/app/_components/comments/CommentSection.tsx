'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, FormEvent, useEffect } from 'react';
import Image from 'next/image';

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  parentId?: string;
};

type CommentWithReplies = Comment & { replies?: CommentWithReplies[] };

function buildCommentTree(comments: Comment[]): CommentWithReplies[] {
  const map = new Map<string, CommentWithReplies>();
  comments.forEach(c => map.set(c.id, { ...c, replies: [] }));

  const roots: CommentWithReplies[] = [];
  comments.forEach(c => {
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) parent.replies!.push(map.get(c.id)!);
    } else {
      roots.push(map.get(c.id)!);
    }
  });
  return roots;
}

function CommentList({
  comments,
  replyTo,
  setReplyTo,
  replyText,
  setReplyText,
  handleReplySubmit,
  session,
  editId,
  setEditId,
  editText,
  setEditText,
  handleEdit,
  handleEditSubmit,
  menuOpen,
  setMenuOpen,
  handleDelete,
  depth = 0,
}: {
  comments: CommentWithReplies[];
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  handleReplySubmit: (e: FormEvent, parentId: string) => void;
  session: any;
  editId: string | null;
  setEditId: (id: string | null) => void;
  editText: string;
  setEditText: (text: string) => void;
  handleEdit: (comment: Comment) => void;
  handleEditSubmit: (id: string) => void;
  menuOpen: string | null;
  setMenuOpen: (id: string | null) => void;
  handleDelete: (id: string) => void;
  depth?: number;
}) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 드롭다운 내부 클릭이면 무시
      if ((e.target as HTMLElement).closest('.dropdown-menu')) return;
      setMenuOpen(null);
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <>
      {comments.map(comment => {
        const isMine =
          (comment.user?.id && session?.user?.id && comment.user.id === session.user.id) ||
          (comment.user?.email && session?.user?.email && comment.user.email === session.user.email);
        return (
          <div key={comment.id} className="my-8 relative">
            <div className="flex items-center mb-2">
              {comment.user?.image ? (
                <Image
                  src={comment.user.image}
                  alt={comment.user.name || '프로필'}
                  width={36}
                  height={36}
                />
              ) : (
                <div className="w-8 h-8 bg-indigo-500 flex items-center justify-center text-white rounded-full">
                  {comment.user?.name?.charAt(0) || comment.user?.email?.charAt(0) || '?'}
                </div>
              )}
              <span className="ml-3 font-medium">{comment.user?.name || comment.user?.email}</span>
              <span className="ml-3 text-xs text-gray-500">
                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ""}
              </span>
            </div>
            {editId === comment.id ? (
              <div className="my-2">
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:outline-none resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditId(null)} className=" px-4  py-2 bg-gray-200 text-gray-700">취소</button>
                  <button onClick={() => handleEditSubmit(comment.id)} className=" px-4  py-2 bg-gray-900 text-white">저장</button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line">{comment.text}</p>
            )}
            {editId !== comment.id && (

            <button
            className="text-xs text-gray-500 "
            onClick={() => setReplyTo(comment.id)}
          >
            답글
          </button>
            )}
            {isMine && (
              <div className="absolute top-2 right-2">
                <button
                  onClick={() => setMenuOpen(menuOpen === comment.id ? null : comment.id)}
                  className="p-1"
                  aria-label="댓글 옵션"
                >
                  <span className="text-xl">⋯</span>
                </button>
                {menuOpen === comment.id && (
                  <div className="dropdown-menu absolute right-0 mt-2 w-24 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        handleEdit(comment);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(null);
                        handleDelete(comment.id);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
            {replyTo === comment.id && (
              <form onSubmit={e => handleReplySubmit(e, comment.id)} className="mt-2 mb-12">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="w-full p-2 border border-gray-300 focus:outline-none resize-none"
                  rows={2}
                  placeholder="답글을 입력하세요"
                  required
                />
                <div className="float-right flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReplyTo(null);
                      setReplyText("");
                    }}
                    className=" px-4 py-1 bg-gray-200 text-gray-700"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className=" px-4 py-1 bg-gray-900 text-white"
                  >
                    등록
                  </button>
                </div>
              </form>
            )}
            {comment.replies && comment.replies.length > 0 && (
              <div className={depth < 2 ? "ml-2 border-l pl-3" : ""}>
                <CommentList
                  comments={comment.replies}
                  replyTo={replyTo}
                  setReplyTo={setReplyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  handleReplySubmit={handleReplySubmit}
                  session={session}
                  editId={editId}
                  setEditId={setEditId}
                  editText={editText}
                  setEditText={setEditText}
                  handleEdit={handleEdit}
                  handleEditSubmit={handleEditSubmit}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  handleDelete={handleDelete}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session, status } = useSession();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  useEffect(() => {
    fetch(`/api/comments?postId=${postId}`)
      .then(res => res.json())
      .then(data => {
        setComments(buildCommentTree(data));
      });
  }, [postId]);
  
  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user) return;

    const res = await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, text: comment }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setComment('');
    } else {
      let errorMsg = '댓글 작성 실패';
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        // 응답이 비어있으면 그냥 기본 메시지
      }
      alert(errorMsg);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/comments?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert("삭제 실패");
    }
  };
  
  const handleEdit = (comment: Comment) => {
    setEditId(comment.id);
    setEditText(comment.text);
  };
  
  const handleEditSubmit = async (id: string) => {
    const res = await fetch("/api/comments", {
      method: "PATCH",
      body: JSON.stringify({ id, text: editText }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const updated = await res.json();
      setComments(comments.map(c => c.id === id ? updated : c));
      setEditId(null);
      setEditText("");
    } else {
      alert("수정 실패");
    }
  };
  
  const handleReplySubmit = async (e: FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !session?.user) return;

    const res = await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, text: replyText, parentId }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (res.ok) {
      // 새로고침 or fetch로 댓글 목록 갱신
      fetch(`/api/comments?postId=${postId}`)
        .then(res => res.json())
        .then(data => setComments(buildCommentTree(data)));
      setReplyTo(null);
      setReplyText("");
    } else {
      alert("답글 작성 실패");
    }
  };
  
  if (status === "loading") {
    return <div className="my-8 p-4">로딩중...</div>;
  }
  
  return (
    <div className="my-16 max-w-2xl mx-auto">

      {!session && (
      <div className="max-w-2xl mx-auto my-8 ">
        <button onClick={() => signIn('google')} className="px-4 py-2 bg-gray-900 text-white hover:bg-graY-950 transition-colors">
          Google로 로그인
        </button>
      </div>
      )}
      {session && (
        <>
          <div className="flex items-center justify-stretch">
            <div className="flex items-center">
              <div className="flex items-center">
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || '프로필'}
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-500 flex items-center justify-center text-white">
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || '?'}
                  </div>
                )}
                <span className="ml-3 font-medium">
                  {session.user?.name || session.user?.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-4 text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmitComment} className="mt-4">
            <textarea
              placeholder="댓글을 작성해주세요..."
              className="w-full p-4 border border-none focus:outline-double focus:outline-gray-300 resize-none"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            {comment.trim() && (
              <div className="flex gap-2 mt-2 float-right">
                <button
                  type="button"
                  onClick={() => setComment("")}
                  className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-950 transition-colors"
                >
                입력
                </button>
              </div>
            )}
          </form>
        </>
      )}

      {comments.length > 0 && (
        <div className="mt-16">
          <CommentList
            comments={comments}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            replyText={replyText}
            setReplyText={setReplyText}
            handleReplySubmit={handleReplySubmit}
            session={session}
            editId={editId}
            setEditId={setEditId}
            editText={editText}
            setEditText={setEditText}
            handleEdit={handleEdit}
            handleEditSubmit={handleEditSubmit}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            handleDelete={handleDelete}
          />
        </div>
      )}

    </div>
  );
}