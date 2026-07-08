"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToDynamicResult({ source }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const resultId = searchParams.get("resultId");
    const params = new URLSearchParams();
    if (source) params.set("source", source);
    if (resultId) params.set("resultId", resultId);
    const qs = params.toString();
    router.replace(qs ? `/result/ccc?${qs}` : "/result/ccc");
  }, [router, searchParams, source]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto" />
    </div>
  );
}

function makeRedirectPage(source) {
  return function RedirectPage() {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto" />
          </div>
        }
      >
        <RedirectToDynamicResult source={source} />
      </Suspense>
    );
  };
}

export default makeRedirectPage;
