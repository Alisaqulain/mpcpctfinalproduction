"use client";
import React, { useState, useEffect } from "react";
import UserProfileAvatar from "@/components/common/UserProfileAvatar";
import {
  fetchUserProfileFromApi,
  mergeExamUserProfile,
  readExamUserDataFromStorage,
  resolveUserProfileUrl,
} from "@/lib/userProfile";

export default function ExamInstructions() {
  const [language, setLanguage] = useState("हिन्दी");
  const [userName, setUserName] = useState("User");
  const [examData, setExamData] = useState(null);
  const [questionLanguage, setQuestionLanguage] = useState("हिन्दी");
  const [isAgreed, setIsAgreed] = useState(true);
  const [showError, setShowError] = useState(false);
  const [userProfileUrl, setUserProfileUrl] = useState("/lo.jpg");

  const isHindi = language === "हिन्दी" || language === "Hindi";
  const brandName = "MPCPCT";

  useEffect(() => {
    const userDataStr = localStorage.getItem("examUserData");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.name) {
          setUserName(userData.name);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    const loadProfile = async () => {
      const examUser = readExamUserDataFromStorage();
      let apiUser = null;
      try {
        apiUser = await fetchUserProfileFromApi();
      } catch {
        /* ignore */
      }
      const mergedUser = mergeExamUserProfile(examUser, apiUser);
      setUserProfileUrl(resolveUserProfileUrl(mergedUser));
      if (mergedUser.name) {
        setUserName(mergedUser.name);
      }
    };

    loadProfile();

    const savedLang = localStorage.getItem("questionLanguage");
    if (savedLang) {
      setQuestionLanguage(savedLang);
    } else {
      setQuestionLanguage("हिन्दी");
      localStorage.setItem("questionLanguage", "हिन्दी");
    }

    const examId = localStorage.getItem("currentExamId");
    const examType = localStorage.getItem("examType");
    if (examId) {
      fetch(`/api/exams?key=${examType || ""}`)
        .then((res) => res.json())
        .then((data) => {
          const exam = data.exams?.find((e) => e._id === examId);
          if (exam) {
            setExamData(exam);
          }
        })
        .catch((error) => console.error("Error fetching exam:", error));
    }
  }, []);

  const handleStartTest = () => {
    if (!isAgreed) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    setShowError(false);
    localStorage.removeItem("examProgress");
    localStorage.removeItem("examTimeLeft");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("typingTimeLeft-")) localStorage.removeItem(key);
    });
    localStorage.setItem("questionLanguage", questionLanguage);
      window.location.replace("/exam_mode");
  };

  const colorLegendHindi = (
    <>
      <p className="text-center text-base font-semibold leading-snug">
        कृपया परीक्षा के निर्देशों को ध्यान से पढ़ें
      </p>
      <p className="mt-3 text-base font-bold">सामान्य निर्देश:</p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-gray-500 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          1
        </span>
        आपने अभी तक यह प्रश्न नहीं देखा है।
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-orange-600 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          2
        </span>
        आपने इस प्रश्न के लिए कोई उत्तर नहीं चुना है।
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-green-500 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          3
        </span>
        आपने इस प्रश्न के लिए उत्तर चुन लिया है।
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-[#4c2483] border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          4
        </span>
        आपने इस प्रश्न का उत्तर नहीं दिया है, पर इसे समीक्षा के लिए रखा है।
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-[#4c2483] border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          5
        </span>
        &quot;उत्तर दिया गया और समीक्षा के लिए चिह्नित&quot; प्रश्नों पर मूल्यांकन
        हेतु विचार किया जाएगा।
      </p>
      <p className="mt-4 text-sm font-semibold leading-relaxed">
        1. परीक्षा प्रश्नों की भाषा बदलने के लिए, अपने सेक्शन बार के ऊपरी दाएं
        कोने में &quot;View in&quot; ढूंढें और पूरी प्रश्न-पत्रिका की भाषा बदलने
        के लिए उस पर क्लिक करें।
      </p>
      <h2 className="font-bold mt-4 text-base">प्रश्न पर नेविगेट करना:</h2>
      <p className="mt-2 text-sm leading-relaxed">
        2. किसी प्रश्न का उत्तर देने के लिए, निम्न कार्य करें:
        <br />
        a. किसी विशेष प्रश्न पर तुरंत पहुंचने के लिए, स्क्रीन के दाईं ओर प्रश्न
        पैलेट में उस प्रश्न की संख्या पर क्लिक करें।
        <br />
        b. यदि आप अपना वर्तमान उत्तर सहेजना और अगले प्रश्न पर जाना चाहते हैं, तो
        &quot;Save &amp; Next&quot; पर क्लिक करें।
        <br />
        c. यदि आप अपना वर्तमान उत्तर सहेजना चाहते हैं, इसे समीक्षा के लिए
        चिह्नित करना चाहते हैं, और अगले प्रश्न पर जाना चाहते हैं, तो &quot;Mark
        for Review &amp; Next&quot; पर क्लिक करें।
      </p>
      <h2 className="font-bold mt-4 text-base">प्रश्न का उत्तर देना:</h2>
      <p className="mt-2 text-sm leading-relaxed">
        3. बहुविकल्पीय प्रश्न का उत्तर देने की प्रक्रिया:
        <br />
        a. उत्तर चुनने के लिए, एक विकल्प का बटन दबाएं।
        <br />
        b. यदि आप चुना हुआ उत्तर हटाना चाहते हैं, तो &quot;Clear Response&quot;
        पर क्लिक करें।
        <br />
        c. उत्तर सहेजने के लिए, &quot;Save &amp; Next&quot; बटन पर क्लिक करना
        ज़रूरी है।
      </p>
      <h2 className="font-bold mt-4 text-base">अनुभागों के माध्यम से नेविगेट करना:</h2>
      <p className="mt-2 text-sm leading-relaxed pb-2">
        5. स्क्रीन के शीर्ष बार पर अनुभाग देखें और नाम पर क्लिक करें।
        <br />
        6. अंतिम प्रश्न पर &quot;सहेजें और अगला&quot; से अगले अनुभाग पर जाएंगे।
        <br />
        7. परीक्षा के समय में, अनुभागों और प्रश्नों के बीच घूम सकते हैं।
      </p>
    </>
  );

  const colorLegendEnglish = (
    <>
      <p className="text-center text-base font-semibold leading-snug">
        Please read the exam instructions carefully
      </p>
      <p className="mt-3 text-base font-bold">General Instructions:</p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-gray-500 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          1
        </span>
        You have not seen this question yet.
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-orange-600 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          2
        </span>
        You have not chosen any answer for this question.
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-green-500 border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          3
        </span>
        You have chosen an answer for this question.
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-[#4c2483] border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          4
        </span>
        You have not answered this question, but have kept it for review.
      </p>
      <p className="mt-2.5 text-sm leading-relaxed">
        <span className="text-white bg-[#4c2483] border py-1 px-2.5 inline-block mr-1.5 text-sm font-semibold">
          5
        </span>
        Questions marked as &quot;Answered &amp; Marked for Review&quot; will be
        considered for evaluation.
      </p>
      <p className="mt-4 text-sm font-semibold leading-relaxed">
        1. To change the language of exam questions, find &quot;View in&quot; in
        the top right corner of your section bar.
      </p>
      <h2 className="font-bold mt-4 text-base">Navigating Questions:</h2>
      <p className="mt-2 text-sm leading-relaxed">
        2. To answer a question, do the following:
        <br />
        a. Click question number in the palette on the right.
        <br />
        b. Click &quot;Save &amp; Next&quot; to save and continue.
        <br />
        c. Click &quot;Mark for Review &amp; Next&quot; to mark and continue.
      </p>
      <h2 className="font-bold mt-4 text-base">Answering Questions:</h2>
      <p className="mt-2 text-sm leading-relaxed">
        3. Process for answering multiple choice questions:
        <br />
        a. Press the button of one of the options to choose your answer.
        <br />
        b. To deselect, click &quot;Clear Response&quot;.
        <br />
        c. To save, click &quot;Save &amp; Next&quot;.
      </p>
      <h2 className="font-bold mt-4 text-base">Navigating Through Sections:</h2>
      <p className="mt-2 text-sm leading-relaxed pb-2">
        5. View sections on the top bar and click the section name.
        <br />
        6. On the last question, &quot;Save &amp; Next&quot; moves to the next
        section.
        <br />
        7. You can move between sections and questions during the exam.
      </p>
    </>
  );

  const declarationHindi = (
    <>
      <strong className="whitespace-nowrap">घोषणा — {brandName}:</strong>{" "}
      <span className="whitespace-nowrap font-semibold">{brandName}</span> केवल
      सामान्य शैक्षिक उद्देश्यों के लिए अभ्यास परीक्षाएँ प्रदान करता है और यह
      दावा नहीं करता कि ये वास्तविक परीक्षाओं की सामग्री या प्रारूप के समान
      हैं; कोई भी समानता केवल संयोग है। हम प्रश्नों या उत्तरों में अशुद्धताओं के
      लिए जिम्मेदार नहीं हैं, और इन परीक्षणों में प्रदर्शन वास्तविक परीक्षाओं
      में समान परिणामों की गारंटी नहीं देता है। इन्हें अपनी विवेकाधिकार पर
      उपयोग करें। अभ्यास परीक्षाओं का उपयोग करके, आप इन नियमों और शर्तों से
      सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न
      करें। अधिक जानकारी के लिए, कृपया हमारी विस्तृत{" "}
      <span className="text-blue-600">नियम और शर्तें</span> देखें।
    </>
  );

  const declarationEnglish = (
    <>
      <strong className="whitespace-nowrap">Disclaimer — {brandName}:</strong>{" "}
      <span className="whitespace-nowrap font-semibold">{brandName}</span>{" "}
      provides practice tests only for general educational purposes and does not
      claim that these are similar to the content or format of actual exams; any
      similarity is purely coincidental. We are not responsible for inaccuracies
      in questions or answers, and performance in these tests does not guarantee
      similar results in actual exams. Use these at your discretion. By using our
      practice tests, you agree to these terms and conditions. If you do not
      agree, please do not use our services. For more information, please see our
      detailed <span className="text-blue-600">Terms and Conditions</span>.
    </>
  );

  return (
    <div className="h-[100dvh] w-full bg-white text-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#290c52] text-white flex justify-between items-center gap-2 px-3 py-2.5 shrink-0">
        <h1 className="text-sm sm:text-base md:text-xl font-semibold leading-tight">
          <span className="md:hidden">Exam Instructions — </span>
          <span className="hidden md:inline">T&amp;C and Exam Instruction — </span>
          <span className="whitespace-nowrap text-yellow-300">{brandName}</span>
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs">View in :</span>
          <select
            className="bg-white text-black px-2 py-1 rounded text-xs sm:text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="हिन्दी">हिन्दी</option>
            <option value="English">English</option>
          </select>
          <UserProfileAvatar
            src={userProfileUrl}
            alt={userName}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-white object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Main column — fixed footer (declaration + Start) on mobile */}
        <div className="w-full lg:w-[85%] flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Instructions: mobile = color legend only; desktop = full text scroll */}
          <div className="md:hidden flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-2">
            {isHindi ? colorLegendHindi : colorLegendEnglish}
          </div>

          <div className="hidden md:block flex-1 min-h-0 overflow-y-auto px-6 py-4 text-[13px] leading-relaxed">
            <div className="space-y-2">
              {isHindi ? (
                <>
                  <p className="text-center text-[20px]">
                    कृपया परीक्षा के निर्देशों को ध्यान से पढ़ें
                  </p>
                  <p className="mt-2 text-[15px] font-semibold">सामान्य निर्देश:</p>
                  <p className="mt-2">
                    <span className="text-white bg-gray-500 border py-1 px-3">
                      1
                    </span>{" "}
                    आपने अभी तक यह प्रश्न नहीं देखा है।
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-orange-600 border py-1 px-3">
                      2
                    </span>{" "}
                    आपने इस प्रश्न के लिए कोई उत्तर नहीं चुना है।
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-green-500 border py-1 px-3">
                      3
                    </span>{" "}
                    आपने इस प्रश्न के लिए उत्तर चुन लिया है।
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-[#4c2483] border py-1 px-3">
                      4
                    </span>{" "}
                    आपने इस प्रश्न का उत्तर नहीं दिया है, पर इसे समीक्षा के लिए
                    रखा है।
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-[#4c2483] border py-1 px-3">
                      5
                    </span>{" "}
                    &quot;उत्तर दिया गया और समीक्षा के लिए चिह्नित&quot; प्रश्नों
                    पर मूल्यांकन हेतु विचार किया जाएगा।
                  </p>
                  <p className="mt-2 text-[12px] font-semibold">
                    1. परीक्षा प्रश्नों की भाषा बदलने के लिए, अपने सेक्शन बार के
                    ऊपरी दाएं कोने में &quot;View in&quot; ढूंढें और पूरी
                    प्रश्न-पत्रिका की भाषा बदलने के लिए उस पर क्लिक करें।
                  </p>
                  <h2 className="font-bold mt-3">प्रश्न पर नेविगेट करना:</h2>
                  <p className="mt-1 text-[12px]">
                    2. किसी प्रश्न का उत्तर देने के लिए, निम्न कार्य करें:
                  </p>
                  <p className="mt-1 text-[12px]">
                    a. किसी विशेष प्रश्न पर तुरंत पहुंचने के लिए, स्क्रीन के दाईं
                    ओर प्रश्न पैलेट में उस प्रश्न की संख्या पर क्लिक करें।
                    <br />
                    b. यदि आप अपना वर्तमान उत्तर सहेजना और अगले प्रश्न पर जाना
                    चाहते हैं, तो &quot;Save &amp; Next&quot; पर क्लिक करें।
                    <br />
                    c. यदि आप अपना वर्तमान उत्तर सहेजना चाहते हैं, इसे समीक्षा
                    के लिए चिह्नित करना चाहते हैं, और अगले प्रश्न पर जाना
                    चाहते हैं, तो &quot;Mark for Review &amp; Next&quot; पर क्लिक
                    करें।
                  </p>
                  <h2 className="font-bold mt-3">प्रश्न का उत्तर देना:</h2>
                  <p className="text-[12px] mt-1">
                    3. बहुविकल्पीय प्रश्न का उत्तर देने की प्रक्रिया:
                  </p>
                  <p className="mt-1 text-[12px]">
                    a. उत्तर चुनने के लिए, एक विकल्प का बटन दबाएं।
                    <br />
                    b. यदि आप चुना हुआ उत्तर हटाना चाहते हैं, तो &quot;Clear
                    Response&quot; पर क्लिक करें।
                    <br />
                    c. उत्तर सहेजने के लिए, &quot;Save &amp; Next&quot; बटन पर
                    क्लिक करना ज़रूरी है।
                  </p>
                  <h2 className="font-bold mt-3">
                    अनुभागों के माध्यम से नेविगेट करना:
                  </h2>
                  <p className="text-[12px] mt-1">
                    5. स्क्रीन के शीर्ष बार पर अनुभाग देखें और नाम पर क्लिक करें।
                    <br />
                    6. अंतिम प्रश्न पर &quot;सहेजें और अगला&quot; से अगले अनुभाग
                    पर जाएंगे।
                    <br />
                    7. परीक्षा के समय में, अनुभागों और प्रश्नों के बीच घूम सकते
                    हैं।
                  </p>
                </>
              ) : (
                <>
                  <p className="text-center text-[20px]">
                    Please read the exam instructions carefully
                  </p>
                  <p className="mt-2 text-[15px] font-semibold">
                    General Instructions:
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-gray-500 border py-1 px-3">
                      1
                    </span>{" "}
                    You have not seen this question yet.
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-orange-600 border py-1 px-3">
                      2
                    </span>{" "}
                    You have not chosen any answer for this question.
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-green-500 border py-1 px-3">
                      3
                    </span>{" "}
                    You have chosen an answer for this question.
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-[#4c2483] border py-1 px-3">
                      4
                    </span>{" "}
                    You have not answered this question, but have kept it for
                    review.
                  </p>
                  <p className="mt-2">
                    <span className="text-white bg-[#4c2483] border py-1 px-3">
                      5
                    </span>{" "}
                    Questions marked as &quot;Answered &amp; Marked for
                    Review&quot; will be considered for evaluation.
                  </p>
                  <p className="mt-2 text-[12px] font-semibold">
                    1. To change the language of exam questions, find
                    &quot;View in&quot; in the top right corner of your section
                    bar.
                  </p>
                  <h2 className="font-bold mt-3">Navigating Questions:</h2>
                  <p className="mt-1 text-[12px]">
                    2. To answer a question, do the following:
                  </p>
                  <p className="mt-1 text-[12px]">
                    a. Click question number in the palette on the right.
                    <br />
                    b. Click &quot;Save &amp; Next&quot; to save and continue.
                    <br />
                    c. Click &quot;Mark for Review &amp; Next&quot; to mark and
                    continue.
                  </p>
                  <h2 className="font-bold mt-3">Answering Questions:</h2>
                  <p className="text-[12px] mt-1">
                    3. Process for answering multiple choice questions.
                  </p>
                  <h2 className="font-bold mt-3">Navigating Through Sections:</h2>
                  <p className="text-[12px] mt-1">
                    5–7. Use the top bar to move between sections and questions.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Bottom panel: declaration scroll + Start (always visible on mobile) */}
          <div
            className="shrink-0 flex flex-col border-t border-gray-200 bg-white px-3 pt-2"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="max-h-[22vh] sm:max-h-[24vh] overflow-y-auto rounded border border-gray-200 bg-gray-50 p-2.5">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 flex-shrink-0"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                />
                <span className="text-sm leading-relaxed">
                  {isHindi ? declarationHindi : declarationEnglish}
                </span>
              </label>
            </div>

            {showError && (
              <div className="mt-1.5 p-2 bg-red-50 border border-red-300 rounded text-red-700 text-sm text-center">
                {isHindi
                  ? "कृपया नियम और शर्तों से सहमत होने के लिए चेकबॉक्स को चेक करें।"
                  : "Please check the checkbox to agree to the terms and conditions."}
              </div>
            )}

            <button
              type="button"
              onClick={handleStartTest}
              className="mt-2 w-full font-semibold py-3.5 text-base sm:text-lg rounded-lg shadow-lg bg-green-500 hover:bg-green-600 text-white cursor-pointer"
            >
              Start Test
            </button>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-[15%] border-l border-gray-300 flex-col items-center justify-start py-6 bg-white">
          <UserProfileAvatar
            src={userProfileUrl}
            alt={userName}
            className="w-24 h-24 rounded-full border-2 border-gray-400 object-cover"
          />
          <p className="mt-2 font-semibold text-blue-800">{userName}</p>
          <span className="border w-full border-black mt-2" />
        </div>
      </div>
    </div>
  );
}
