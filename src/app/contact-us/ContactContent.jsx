"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, Globe } from "lucide-react";
import ContactFormModal from "./ContactFormModal";

export default function ContactContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-gray-50 max-md:h-[calc(100dvh-9rem)] max-md:min-h-0 max-md:overflow-hidden md:min-h-screen flex flex-col items-stretch max-md:justify-start max-md:pt-0 max-md:pb-0 md:items-center md:justify-center px-2 md:px-4 md:py-12">
        <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-3 sm:p-6 space-y-2 sm:space-y-4 text-center max-md:overflow-hidden">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
              Contact Us
            </h1>
            <p className="text-[11px] sm:text-sm text-gray-700 leading-snug px-1">
              For any Question, Suggestion, Feedback, New Information Required or Any Bug
              Found on Website please email us -
            </p>
          </div>

          <div className="space-y-1.5 sm:space-y-3 text-left">
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full">
              <Phone className="text-green-600 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              <span className="text-gray-800 font-medium text-sm">8989966753</span>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full">
              <Mail className="text-green-600 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              <span className="text-gray-800 font-medium text-xs sm:text-base break-all">
                Mpcpct111@gmail.com
              </span>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2 w-full">
              <Globe className="text-green-600 w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 shrink-0" />
              <a
                href="https://www.mpcpct.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-800 font-bold underline text-sm"
              >
                MPCPCT
              </a>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-md px-2.5 py-2 sm:px-4 sm:py-3 text-left text-[10px] sm:text-sm leading-snug">
            <ul className="list-disc pl-3.5 sm:pl-5 text-gray-800 space-y-1">
              <li>
                <span className="text-blue-600 font-semibold">Hi, Hello</span> के मैसेज ना
                करें | सीधा मैसेज भेजें |
              </li>
              <li>
                मैसेज करने के बाद जवाब के लिए इंतजार करें, उचित Query का रिप्लाई{" "}
                <strong>24 Hr</strong> में देने का प्रयास रहेगा |
              </li>
              <li>
                <span className="text-red-600 font-semibold">
                  कृपया इस नंबर पे कॉल ना करें अन्यथा नंबर ब्लॉक कर दिया जायेगा |
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-md border border-gray-300 px-3 py-2.5 sm:py-4 flex flex-col items-center">
            <img
              src="/lo.jpg"
              alt="MPCPCT Support"
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-full mb-1.5 sm:mb-2 object-cover border border-gray-200"
            />
            <h3 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base">
              MPCPCT Support Team
            </h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 cursor-pointer text-white px-4 py-1.5 sm:py-2 rounded shadow hover:bg-blue-600 transition-colors text-sm"
              type="button"
            >
              Message Me
            </button>
          </div>
        </div>

        <div className="hidden md:block max-w-xl mx-auto mt-8 text-center">
          <Link
            href="/"
            className="inline-block text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <ContactFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
