'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import { useSession } from 'next-auth/react';

// 마크다운 에디터를 클라이언트 사이드에서만 로드
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => {
    const { default: Editor, commands } = mod;
    return { default: Editor, commands };
  }),
  { ssr: false }
);

// 허용된 이메일 주소
const ALLOWED_EMAIL = 'inyoomin1025@gmail.com'; // 여기에 본인의 이메일 주소를 입력하세요

export default function Editor() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [metadata, setMetadata] = useState({
    title: '',
    excerpt: '',
    coverImage: '',
    date: new Date().toISOString().split('T')[0],
    audioTitle: '',
    audioAuthor: '',
    audioId: '',
    isList: false,
    allowComments: true,
    ogImage: { url: '' },
    showCover: true,
    showCanvas: false
  });
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  // 로딩 중이거나 인증되지 않은 경우
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  // 인증되지 않았거나 허용되지 않은 이메일인 경우
  if (!session || session.user?.email !== ALLOWED_EMAIL) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h1>
          <p className="text-gray-600">이 페이지에 접근할 수 있는 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  const handleMetadataChange = (field: string, value: any) => {
    if (field === 'date') {
      // 선택한 날짜에 현재 시간을 추가
      const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
      const dateTime = `${value}T${currentTime}`;
      setMetadata(prev => ({
        ...prev,
        [field]: dateTime
      }));
    } else {
      setMetadata(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // 현재 커서 위치에 이미지 마크다운 삽입
      const imageMarkdown = `![${file.name}](${data.url})`;
      if (type === 'cover') {
        setMetadata(prev => ({ ...prev, coverImage: data.url }));
        setContent(prev => prev + '\n' + imageMarkdown);
      } else if (type === 'og') {
        setMetadata(prev => ({ ...prev, ogImage: { url: data.url } }));
        setContent(prev => prev + '\n' + imageMarkdown);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 날짜가 ISO 문자열 형식인지 확인
      const date = new Date(metadata.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }

      const frontmatter = matter.stringify(content, {
        ...metadata,
        date: date.toISOString() // ISO 형식으로 변환
      });

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: metadata.title,
          content: frontmatter,
          coverImage: metadata.coverImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const data = await response.json();
      router.push(`/posts/${data.slug}`);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('포스트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={metadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
              className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">작성일</label>
            <input
              type="date"
              value={metadata.date.split('T')[0]}
              onChange={(e) => handleMetadataChange('date', e.target.value)}
              className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
          <textarea
            value={metadata.excerpt}
            onChange={(e) => handleMetadataChange('excerpt', e.target.value)}
            className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
            rows={3}
          />
        </div>

        {/* 이미지 관련 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">커버 이미지</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={coverImageInputRef}
                onChange={(e) => handleImageUpload(e, 'cover')}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverImageInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-400 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '커버 이미지 첨부'}
              </button>
              {metadata.coverImage && (
                <span className="text-sm text-gray-500 truncate">
                  {metadata.coverImage.split('/').pop()}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG 이미지</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={ogImageInputRef}
                onChange={(e) => handleImageUpload(e, 'og')}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => ogImageInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center px-3 py-1.5 border border-gray-400 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : 'OG 이미지 첨부'}
              </button>
              {metadata.ogImage.url && (
                <span className="text-sm text-gray-500 truncate">
                  {metadata.ogImage.url.split('/').pop()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 오디오 관련 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">오디오 제목</label>
            <input
              type="text"
              value={metadata.audioTitle}
              onChange={(e) => handleMetadataChange('audioTitle', e.target.value)}
              className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">오디오 작가</label>
            <input
              type="text"
              value={metadata.audioAuthor}
              onChange={(e) => handleMetadataChange('audioAuthor', e.target.value)}
              className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">오디오 ID</label>
            <input
              type="text"
              value={metadata.audioId}
              onChange={(e) => handleMetadataChange('audioId', e.target.value)}
              className="block w-full border border-gray-400 focus:border-gray-400 focus:ring-gray-600"
            />
          </div>
        </div>

        {/* 옵션 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isList"
              checked={metadata.isList}
              onChange={(e) => handleMetadataChange('isList', e.target.checked)}
              className="h-4 w-4 text-gray-600 focus:ring-gray-600 border-gray-400"
            />
            <label htmlFor="isList" className="ml-2 block text-sm text-gray-900">
              플레이리스트
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowComments"
              checked={metadata.allowComments}
              onChange={(e) => handleMetadataChange('allowComments', e.target.checked)}
              className="h-4 w-4 text-gray-600 focus:ring-gray-600 border-gray-400"
            />
            <label htmlFor="allowComments" className="ml-2 block text-sm text-gray-900">
              댓글 허용
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCover"
              checked={metadata.showCover}
              onChange={(e) => handleMetadataChange('showCover', e.target.checked)}
              className="h-4 w-4 text-gray-600 focus:ring-gray-600 border-gray-400"
            />
            <label htmlFor="showCover" className="ml-2 block text-sm text-gray-900">
              커버 이미지 표시
            </label>
          </div>
        </div>

        {/* 에디터 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-gray-400 p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                마크다운 에디터
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleImageUpload(e, 'content')}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-400 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50"
                >
                  {isUploading ? '업로드 중...' : '이미지 첨부'}
                </button>
              </div>
            </div>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(value) => setContent(value || '')}
                height={500}
                preview="edit"
              />
            </div>
          </div>

          {/* 미리보기 섹션 */}
          <div className="border border-gray-400 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              미리보기
            </label>
            <div className="prose max-w-none h-[500px] overflow-y-auto">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-gray-400 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50"
          >
            {isSubmitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
