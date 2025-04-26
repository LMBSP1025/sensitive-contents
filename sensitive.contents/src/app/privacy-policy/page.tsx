export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">개인정보처리방침</h1>
      <p className="mb-4">본 웹사이트는 소셜 로그인 시 사용자의 기본 프로필 정보를 수집합니다.</p>
      <h2 className="text-xl font-bold mb-2">수집하는 정보</h2>
      <ul className="list-disc ml-6 mb-4">
        <li>이름</li>
        <li>프로필 이미지</li>
        <li>이메일 주소 (선택적)</li>
      </ul>
      <h2 className="text-xl font-bold mb-2">정보 사용 목적</h2>
      <p className="mb-4">수집된 정보는 댓글 작성자 식별 및 표시 목적으로만 사용됩니다.</p>
      <h2 className="text-xl font-bold mb-2">정보 보관 기간</h2>
      <p className="mb-4">사용자 정보는 서비스 이용 기간 동안 보관되며, 계정 삭제 시 함께 삭제됩니다.</p>
      <h2 className="text-xl font-bold mb-2">제3자 제공</h2>
      <p>수집된 정보는 제3자에게 제공되지 않습니다.</p>
    </div>
  );
}
