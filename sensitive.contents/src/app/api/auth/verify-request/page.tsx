export default function VerifyRequest() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
        <svg
          className="mx-auto h-16 w-16 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">이메일을 확인해주세요</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          로그인 링크가 포함된 이메일을 보냈습니다.<br />
          받은편지함을 확인하고 링크를 클릭하여 로그인을 완료하세요.
        </p>
      </div>
    </div>
  );
}
