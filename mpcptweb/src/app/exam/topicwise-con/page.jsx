"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TopicWiseInstructionsContent() {
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState("हिन्दी");
  const [userName, setUserName] = useState("User");
  const [topic, setTopic] = useState(null);
  const [questionLanguage, setQuestionLanguage] = useState("English");
  const [isAgreed, setIsAgreed] = useState(true); // Auto-ticked
  const [showError, setShowError] = useState(false);
  const [topicId, setTopicId] = useState(null);

  useEffect(() => {
    // Get topicId from URL
    const topicIdParam = searchParams.get('topicId');
    if (topicIdParam) {
      setTopicId(topicIdParam);
    }

    // Load user data from localStorage
    const userDataStr = localStorage.getItem('examUserData');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        if (userData.name) {
          setUserName(userData.name);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Load topic data
    if (topicIdParam) {
      fetch(`/api/topicwise/topics?topicId=${topicIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.topic) {
            setTopic(data.topic);
          }
        })
        .catch(error => console.error('Error fetching topic:', error));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white-100 text-black flex flex-col">
      {/* Header */}
      <div className="bg-[#290c52] text-white flex justify-between items-center px-6 py-4 w-full">
        <h1 className="text-lg md:text-xl font-semibold">
          T&C and Exam Instruction - Topic Wise MCQ
        </h1>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block">View in :</span>
          <select
            className="bg-white text-black px-2 py-1 rounded text-sm"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
            }}
          >
            <option value="हिन्दी">हिन्दी</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col lg:flex-row h-full">
        {/* Main Content */}
        <div className="w-full lg:w-[85%] px-6 py-4 overflow-y-auto h-[50%]">
          <div className="max-h-[45vh] overflow-y-auto pr-2">
            <div className="space-y-2 text-sm md:text-[13px] leading-relaxed">
              {language === "हिन्दी" ? (
                <>
                  <p className="text-center text-[20px]"> कृपया परीक्षा के निर्देशों को ध्यान से पढ़ें</p>
                  <p className="mt-5 text-[15px] font-semibold"> सामान्य निर्देश:</p>
                  <p className="mt-8"><span className="text-white bg-gray-500 border py-1 md:py-2 px-3 md:px-4">1</span>  आपने अभी तक यह प्रश्न नहीं देखा है।</p>
                  <p className="mt-8"><span className="text-white bg-orange-600 border py-1 md:py-2 px-3 md:px-4">2</span>  आपने इस प्रश्न के लिए कोई उत्तर नहीं चुना है।</p>
                  <p className="mt-8"><span className="text-white bg-green-500 border py-1 md:py-2 px-3 md:px-4">3</span>  आपने इस प्रश्न के लिए उत्तर चुन लिया है।</p>
                  <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">4</span>  आपने इस प्रश्न का उत्तर नहीं दिया है, पर इसे समीक्षा के लिए रखा है।</p>
                  <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">5</span>  "उत्तर दिया गया और समीक्षा के लिए चिह्नित" प्रश्नों पर मूल्यांकन हेतु विचार किया जाएगा।</p>
                  <p className="mt-8 text-[12px] font-semibold">1. परीक्षा प्रश्नों की भाषा बदलने के लिए, अपने सेक्शन बार के ऊपरी दाएं कोने में "View in" ढूंढें और पूरी प्रश्न-पत्रिका की भाषा बदलने के लिए उस पर क्लिक करें।</p>
                  <h2 className="font-bold mt-6 text-base md:text-lg">प्रश्न पर नेविगेट करना:</h2>
                  <p className="mt-4 text-[12px]">2. किसी प्रश्न का उत्तर देने के लिए, निम्न कार्य करें:</p>
                  <p className="mt-4 text-[12px]">a. किसी विशेष प्रश्न पर तुरंत पहुंचने के लिए, स्क्रीन के दाईं ओर प्रश्न पैलेट में उस प्रश्न की संख्या पर क्लिक करें। कृपया ध्यान दें कि ऐसा करने से आपके वर्तमान प्रश्न का उत्तर सुरक्षित नहीं होगा। <br/>
                  b. यदि आप अपना वर्तमान उत्तर सहेजना और अगले प्रश्न पर जाना चाहते हैं, तो "Save & Next" पर क्लिक करें। <br/>
                  c. यदि आप अपना वर्तमान उत्तर सहेजना चाहते हैं, इसे समीक्षा के लिए चिह्नित करना चाहते हैं, और अगले प्रश्न पर जाना चाहते हैं, तो "Mark for Review & Next" पर क्लिक करें।</p>
                  <h2 className="font-bold mt-6 text-base md:text-lg">प्रश्न का उत्तर देना:</h2>
                  <p className="text-[12px] mt-4">3. बहुविकल्पीय प्रश्न का उत्तर देने की प्रक्रिया:<br/></p>
                  <p className="mt-4 text-[12px]">a. उत्तर चुनने के लिए, एक विकल्प का बटन दबाएं।<br/>
                  b. यदि आप चुना हुआ उत्तर हटाना चाहते हैं, तो उसी बटन को फिर से दबाएं या "Clear Response" पर क्लिक करें।<br/>
                  c. दूसरा उत्तर चुनने के लिए, किसी और विकल्प का बटन दबाएं।<br/>
                  d. उत्तर सहेजने के लिए, "Save & Next" बटन पर क्लिक करना ज़रूरी है।<br/>
                  e. प्रश्न को समीक्षा के लिए चिह्नित करने के लिए, "Mark for Review & Next" बटन दबाएं।<br/></p>
                  <p className="text-[12px] mt-3">4. यदि आप पहले से दिए गए किसी उत्तर को बदलना चाहते हैं, तो पहले उस प्रश्न पर वापस जाएं और फिर सामान्य तरीके से उसका उत्तर दें।</p>
                  <h2 className="font-bold mt-6 text-center md:text-lg">कृपया आगे बढ़ने से पहले नीचे दी गई नियम और शर्तें अवश्य पढ़ें।</h2>
                  <p className="text-[12px] mt-3"><span className="font-semibold">परीक्षा की प्रामाणिकता का अस्वीकरण</span><br/>
                  mpcpctmaster.com द्वारा प्रदान किए गए मॉक टेस्ट केवल सामान्य शैक्षिक उद्देश्यों के लिए डिज़ाइन किए गए हैं। हम यह दावा नहीं करते कि ये मॉक टेस्ट वास्तविक परीक्षाओं या आधिकारिक मॉक टेस्ट के समान हैं। वास्तविक परीक्षा की सामग्री या संरचना से कोई भी समानता केवल संयोग है।<br/>
                  <span className="font-semibold mt-3 block">जिम्मेदारी की सीमा</span>
                  mpcpctmaster.com प्रदान किए गए प्रश्नों या उत्तरों में किसी भी अशुद्धता या त्रुटि के लिए जिम्मेदार नहीं है। उपयोगकर्ताओं को सलाह दी जाती है कि वे अपनी विवेकाधिकार का उपयोग करें और सटीक जानकारी के लिए आधिकारिक संसाधनों से परामर्श करें। हम हमारे मॉक टेस्ट के उपयोग से उत्पन्न किसी भी हानि या क्षति के लिए जिम्मेदार नहीं हैं।<br/>
                  <span className="font-semibold mt-3 block">परिणामों की कोई गारंटी नहीं</span>
                  हमारे मॉक टेस्ट पर प्रदर्शन वास्तविक परीक्षाओं में समान परिणामों की गारंटी नहीं देता है। ये टेस्ट उपयोगकर्ताओं को सामान्य कंप्यूटर परीक्षा पैटर्न से परिचित कराने के लिए हैं और केवल परीक्षा की तैयारी के लिए उन पर निर्भर नहीं किया जाना चाहिए।<br/>
                  <span className="font-semibold mt-3 block">उपयोगकर्ता की जिम्मेदारी</span>
                  उपयोगकर्ता हमारे मॉक टेस्ट से प्राप्त जानकारी की सटीकता और प्रासंगिकता सुनिश्चित करने के लिए जिम्मेदार हैं। mpcpctmaster.com प्रदान की गई सामग्री की गलतफहमी या गलत व्याख्या के लिए कोई जिम्मेदारी नहीं लेता है।<br/>
                  <span className="font-semibold mt-3 block">नियमों और शर्तों की स्वीकृति</span>
                  हमारे मॉक टेस्ट का उपयोग करके, आप इन नियमों और शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें।<br/>
                  <span className="font-semibold mt-3 block">अधिक जानकारी के लिए</span>
                  अधिक विस्तृत नियमों और शर्तों के लिए, कृपया हमारी आधिकारिक वेबसाइट देखें।</p>
                </>
              ) : (
                <>
                  <p className="text-center text-[20px]">Please read the exam instructions carefully</p>
                  <p className="mt-5 text-[15px] font-semibold">General Instructions:</p>
                  <p className="mt-8"><span className="text-white bg-gray-500 border py-1 md:py-2 px-3 md:px-4">1</span> You have not seen this question yet.</p>
                  <p className="mt-8"><span className="text-white bg-orange-600 border py-1 md:py-2 px-3 md:px-4">2</span> You have not chosen any answer for this question.</p>
                  <p className="mt-8"><span className="text-white bg-green-500 border py-1 md:py-2 px-3 md:px-4">3</span> You have chosen an answer for this question.</p>
                  <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">4</span> You have not answered this question, but have kept it for review.</p>
                  <p className="mt-8"><span className="text-white bg-[#4c2483] border py-1 md:py-2 px-3 md:px-4">5</span> Questions marked as "Answered & Marked for Review" will be considered for evaluation.</p>
                  <p className="mt-8 text-[12px] font-semibold">1. To change the language of exam questions, find "View in" in the top right corner of your section bar and click on it to change the language of the entire question paper.</p>
                  <h2 className="font-bold mt-6 text-base md:text-lg">Navigating Questions:</h2>
                  <p className="mt-4 text-[12px]">2. To answer a question, do the following:</p>
                  <p className="mt-4 text-[12px]">a. To reach a specific question immediately, click on its number in the question palette on the right side of the screen. Please note that doing so will not save your current question's answer. <br/>
                  b. If you want to save your current answer and move to the next question, click "Save & Next". <br/>
                  c. If you want to save your current answer, mark it for review, and move to the next question, click "Mark for Review & Next".</p>
                  <h2 className="font-bold mt-6 text-base md:text-lg">Answering Questions:</h2>
                  <p className="text-[12px] mt-4">3. Process for answering multiple choice questions:<br/></p>
                  <p className="mt-4 text-[12px]">a. To select an answer, press a radio button for an option.<br/>
                  b. If you want to remove the selected answer, press the same button again or click "Clear Response".<br/>
                  c. To select another answer, press a radio button for another option.<br/>
                  d. To save the answer, it is necessary to click the "Save & Next" button.<br/>
                  e. To mark a question for review, press the "Mark for Review & Next" button.<br/></p>
                  <p className="text-[12px] mt-3">4. If you want to change a previously given answer, first go back to that question and then answer it in the usual way.</p>
                  <h2 className="font-bold mt-6 text-base md:text-lg">Navigating Through Sections:</h2>
                  <p className="text-[12px] mt-4">5. See the sections of this question paper on the top bar of the screen. Click on the name of a section to view its questions. The section you are in will be highlighted.<br/>
                  6. When you click "Save & Next" on the last question of a section, you will automatically move to the first question of the next section.<br/>
                  7. During the exam time, you can navigate between sections and questions as you wish.</p>
                  <h2 className="font-bold mt-6 text-center md:text-lg">Please read the rules and conditions given below before proceeding.</h2>
                  <p className="text-[12px] mt-3"><span className="font-semibold">Disclaimer of Exam Authenticity</span><br/>
                  The mock tests provided by mpcpctmaster.com are designed only for general educational purposes. We do not claim that these mock tests are similar to actual exams or official mock tests. Any similarity to the content or structure of the actual exam is purely coincidental.<br/>
                  <span className="font-semibold mt-3 block">Limitation of Liability</span>
                  mpcpctmaster.com is not responsible for any inaccuracies or errors in the questions or answers provided. Users are advised to use their discretion and consult official resources for accurate information. We are not responsible for any loss or damage arising from the use of our mock tests.<br/>
                  <span className="font-semibold mt-3 block">No Guarantee of Results</span>
                  Performance on our mock tests does not guarantee similar results in actual exams. These tests are to familiarize users with general computer exam patterns and should not be relied upon solely for exam preparation.<br/>
                  <span className="font-semibold mt-3 block">User Responsibility</span>
                  Users are responsible for ensuring the accuracy and relevance of information obtained from our mock tests. mpcpctmaster.com does not take any responsibility for misunderstanding or misinterpretation of the content provided.<br/>
                  <span className="font-semibold mt-3 block">Acceptance of Terms and Conditions</span>
                  By using our mock tests, you agree to these terms and conditions. If you do not agree, please do not use our services.<br/>
                  <span className="font-semibold mt-3 block">For More Information</span>
                  For more detailed rules and conditions, please visit our official website.</p>
                </>
              )}
            </div>
          </div>

          {/* Checkbox Disclaimer */}
          <div className="text-xs md:text-sm mt-4">
            <label className="flex items-start gap-2">
              <input 
                type="checkbox" 
                className="mt-1" 
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />

              <span className="text-[13px]">
                {language === "हिन्दी" || language === "Hindi" ? (
                  <>
                    <strong>घोषणा - mpcpctmaster.com :</strong> mpcpctmaster.com केवल सामान्य शैक्षिक उद्देश्यों के लिए मॉक टेस्ट प्रदान करता है और यह दावा नहीं करता कि ये वास्तविक परीक्षाओं की सामग्री या प्रारूप के समान हैं; कोई भी समानता केवल संयोग है। हम प्रश्नों या उत्तरों में अशुद्धताओं के लिए जिम्मेदार नहीं हैं, और इन परीक्षणों में प्रदर्शन वास्तविक परीक्षाओं में समान परिणामों की गारंटी नहीं देता है। इन्हें अपनी विवेकाधिकार पर उपयोग करें। हमारे मॉक टेस्ट का उपयोग करके, आप इन नियमों और शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें। हमारे मॉक टेस्ट का उपयोग करके, आप हमारे नियमों और शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें। अधिक जानकारी के लिए, कृपया हमारी विस्तृत <span className="text-blue-600">नियम और शर्तें </span>देखें।
                  </>
                ) : (
                  <>
                    <strong>Disclaimer - mpcpctmaster.com :</strong> mpcpctmaster.com provides mock tests only for general educational purposes and does not claim that these are similar to the content or format of actual exams; any similarity is purely coincidental. We are not responsible for inaccuracies in questions or answers, and performance in these tests does not guarantee similar results in actual exams. Use these at your discretion. By using our mock tests, you agree to these terms and conditions. If you do not agree, please do not use our services. By using our mock tests, you agree to our terms and conditions. If you do not agree, please do not use our services. For more information, please see our detailed <span className="text-blue-600">Terms and Conditions</span>.
                  </>
                )}
              </span>
            </label>
          </div>

          {/* Error Message */}
          {showError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm text-center">
              {language === "हिन्दी" || language === "Hindi" 
                ? "कृपया नियम और शर्तों से सहमत होने के लिए चेकबॉक्स को चेक करें।" 
                : "Please check the checkbox to agree to the terms and conditions."}
            </div>
          )}

          {/* Start Test Button */}
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => {
                if (!isAgreed) {
                  setShowError(true);
                  setTimeout(() => setShowError(false), 3000);
                  return;
                }
                setShowError(false);
                // Store question language preference
                localStorage.setItem('questionLanguage', questionLanguage);
                // Navigate to topic-wise exam page
                if (topicId) {
                  window.location.href = `/topicwise?topicId=${topicId}`;
                } else {
                  const savedTopicId = localStorage.getItem('currentTopicId');
                  if (savedTopicId) {
                    window.location.href = `/topicwise?topicId=${savedTopicId}`;
                  }
                }
              }}
              className="font-semibold px-12 py-4 text-lg md:text-xl rounded shadow-lg bg-green-500 hover:bg-green-600 text-white cursor-pointer"
            >
              Start Test
            </button>
          </div>
        </div>

        {/* Right Side Profile */}
        <div className="hidden lg:flex lg:w-[15%] border-l border-gray-300 flex-col items-center justify-start py-6 bg-white-100">
          <img
            src="/lo.jpg"
            alt="User"
            className="w-24 h-24 rounded-full border-2 border-gray-400"
          />
          <p className="mt-2 font-semibold text-blue-800">{userName}</p>
          <span className="border w-full border-black mt-2"></span>
        </div>
      </div>
    </div>
  );
}

export default function TopicWiseInstructions() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#290c52]"></div>
      </div>
    }>
      <TopicWiseInstructionsContent />
    </Suspense>
  );
}
