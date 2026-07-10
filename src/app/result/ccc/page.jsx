"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import DynamicResultCertificate from "@/components/result/DynamicResultCertificate";
import ScoreCardCertificate from "@/components/result/ScoreCardCertificate";
import { loadDynamicResult } from "@/lib/loadDynamicResult";

function DynamicResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [homeLink, setHomeLink] = useState("/");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const source = searchParams.get("source") || "";
      const resultId = searchParams.get("resultId");

      const loaded = await loadDynamicResult({ source, resultId });

      if (loaded.ok && loaded.data) {
        setResultData(loaded.data);
        setHomeLink(loaded.data.homeLink || "/");
        setError(null);
      } else if (loaded.redirect) {
        router.replace(loaded.redirect);
        return;
      } else {
        setError(loaded.error || "No result found");
        setHomeLink(loaded.homeLink || "/");
      }
      setLoading(false);
    };
    run();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto" />
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">No Result Found</h1>
          <p className="text-gray-500 mb-4">{error || "Complete an exam or test to see results."}</p>
          <Link href={homeLink} className="text-blue-600 hover:underline">
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  if (resultData.layout === "score-card") {
    return <ScoreCardCertificate data={resultData} />;
  }

  return <DynamicResultCertificate data={resultData} />;
}

export default function CccResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52] mx-auto" />
        </div>
      }
    >
      <DynamicResultContent />
    </Suspense>
  );
}
