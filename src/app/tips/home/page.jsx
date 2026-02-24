"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function FingerPositionScreenForm() {
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const languageParam = searchParams.get("language") || "en";
  const subLanguage = searchParams.get("subLanguage") || "";
  const durationParam = searchParams.get("duration") || "3";
  
  const [language, setLanguage] = useState(languageParam === "hindi" ? "hi" : "en");
  const [loading, setLoading] = useState(true);
  const [tipData, setTipData] = useState(null);
  const [error, setError] = useState(null);

  // Default content (fallback if tip not found)
  const defaultContent = {
    en: {
      title: "Home Finger Positions",
      paragraph:
        'In their basic position, your fingers rest on the middle row of the keyboard – also called the "home row". The home row is the base from which all other keys can be reached.',
      steps: [
        "Put your left hand fingers on keys A S D F",
        "Put your right hand fingers on keys J K L ;",
        "Let the thumbs rest lightly on the space bar",
        "Keep your wrists straight and fingers lightly curled"
      ],
      tip:
        "Can you feel small bumps on the F and J keys? They are there to help you find the home row keys without looking at your hands.",
      cancel: "Cancel",
      next: "Next",
    },
    hi: {
      title: "होम फिंगर पोज़िशन",
      paragraph:
        "मूल स्थिति में, आपकी उंगलियां कीबोर्ड की बीच वाली पंक्ति पर रहती हैं जिसे 'होम रो' कहा जाता है। होम रो वह आधार है जहाँ से बाकी सभी कुंजियों तक आसानी से पहुंचा जा सकता है।",
      steps: [
        "अपनी बाईं हाथ की उंगलियां A S D F कुंजियों पर रखें",
        "अपनी दाईं हाथ की उंगलियां J K L ; कुंजियों पर रखें",
        "अंगूठों को स्पेस बार पर हल्के से रखें",
        "कलाई को सीधा रखें और उंगलियों को हल्का मोड़कर रखें"
      ],
      tip:
        "क्या आप F और J कुंजियों पर छोटे उभार महसूस कर सकते हैं? ये आपको बिना देखे होम रो खोजने में मदद करते हैं।",
      cancel: "रद्द करें",
      next: "आगे",
    },
  };

  // Fetch tip content from API
  useEffect(() => {
    const fetchTip = async () => {
      if (!lessonId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/tips?lessonId=${lessonId}`);
        if (res.ok) {
          const data = await res.json();
          setTipData(data.tip);
        } else if (res.status === 404) {
          // Tip not found, use default content
          setTipData(null);
        } else {
          setError("Failed to load tip content");
        }
      } catch (err) {
        console.error("Error fetching tip:", err);
        setError("Failed to load tip content");
      } finally {
        setLoading(false);
      }
    };

    fetchTip();
  }, [lessonId]);

  // Get content based on language and tip data
  const getContent = () => {
    if (tipData) {
      return {
        title: language === "hi" && tipData.title_hi ? tipData.title_hi : tipData.title_en,
        paragraph: language === "hi" && tipData.paragraph_hi ? tipData.paragraph_hi : tipData.paragraph_en,
        steps: language === "hi" && tipData.steps_hi?.length > 0 ? tipData.steps_hi : (tipData.steps_en || []),
        tip: language === "hi" && tipData.tip_hi ? tipData.tip_hi : tipData.tip_en,
        cancel: language === "hi" && tipData.cancelText_hi ? tipData.cancelText_hi : tipData.cancelText_en,
        next: language === "hi" && tipData.nextText_hi ? tipData.nextText_hi : tipData.nextText_en,
        imageUrl: tipData.imageUrl || "/homefinger.jpg",
      };
    }
    return defaultContent[language];
  };

  const lang = getContent();

  return (
    <div className="min-h-[80%] bg-gradient-to-br from-purple-50 via-blue-50 to-purple-100 border border-gray-300 shadow-lg max-w-3xl mx-auto mt-4 md:mt-10 rounded-md overflow-hidden mb-4 md:mb-10">
      
      {/* Header */}
      <div className="bg-[rgb(41,12,82)] text-white py-2 text-lg md:text-xl font-semibold px-4 flex justify-between items-center">
        <span className="flex-1 text-center">
          {lang.title}
        </span>

        {/* Language Dropdown */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-white text-blue-600 px-2 py-1 rounded text-sm"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 text-gray-800 space-y-4 text-[14px] md:text-[16px] leading-relaxed relative bg-white/70 backdrop-blur-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p>Loading tip content...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            {lang.paragraph && <p>{lang.paragraph}</p>}


            {lang.steps && lang.steps.length > 0 && (
              <div>
                <strong>{lang.title}:</strong>
                <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
                  {lang.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {lang.tip && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 px-4 py-2 text-sm">
                <strong>Tip!</strong> {lang.tip}
              </div>
            )}

            <div className="flex justify-center relative md:static">
              <img
                src={lang.imageUrl || "/homefinger.jpg"}
                alt="Finger Positions on Keyboard"
                className="w-[80%] max-w-[150px] md:max-w-[18%] md:absolute md:top-[100px] md:right-[100px]"
              />
            </div>
          </>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex justify-between items-center bg-gray-100 p-4 border-t">
        <button className="bg-white border border-gray-300 px-4 py-1 rounded hover:bg-gray-200">
          <a href="/learning">{lang.cancel}</a>
        </button>
        <button className="bg-blue-600 text-white px-6 py-1 rounded hover:bg-blue-700">
          <a href={lessonId ? `/keyboard?lesson=${lessonId}&language=${languageParam}&subLanguage=${subLanguage}&duration=${durationParam}` : `/keyboard?duration=${durationParam}`}>{lang.next}</a>
        </button>
      </div>
    </div>
  );
}

export default function FingerPositionScreen() {
  return (
    <Suspense fallback={
      <div className="min-h-[80%] bg-white border border-gray-300 shadow-lg max-w-3xl mx-auto mt-4 md:mt-10 rounded-md overflow-hidden mb-4 md:mb-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <FingerPositionScreenForm />
    </Suspense>
  );
}
