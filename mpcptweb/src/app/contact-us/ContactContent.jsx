"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, Globe } from "lucide-react";
import ContactFormModal from "./ContactFormModal";

export default function ContactContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6 text-center">
          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contact Us</h1>
            <p className="text-sm text-gray-700 leading-relaxed">
              For any Question, Suggestion, Feedback, New Information Required or Any Bug Found on
              Website please email us -
            </p>
          </div>

          {/* Contact Info Boxes */}
          <div className="space-y-4 text-left">
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-4 py-3 w-full">
              <Phone className="text-green-600 w-5 h-5 mr-3" />
              <span className="text-gray-800 font-medium">8989966753</span>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-4 py-3 w-full">
              <Mail className="text-green-600 w-5 h-5 mr-3" />
              <span className="text-gray-800 font-medium">Mpcpct111@gmail.com</span>
            </div>

            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-4 py-3 w-full">
              <Globe className="text-green-600 w-5 h-5 mr-3" />
              <a
                href="https://www.mpcpct.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-800 font-bold underline"
              >
                MPCPCT
              </a>
            </div>
          </div>

          {/* Hindi Instruction + Support Box */}
          <div className="bg-gray-50 border border-gray-300 rounded-md px-4 py-4 text-left text-sm space-y-2">
            <ul className="list-disc pl-5 text-gray-800">
              <li><span className="text-blue-600 font-semibold">Hi, Hello</span> के मैसेज ना करें | सीधा मैसेज भेजें |</li>
              <li>मैसेज करने के बाद जवाब के लिए इंतजार करें, उचित Query का रिप्लाई <strong>24 Hr</strong> में देने का प्रयास रहेगा |</li>
              <li><span className="text-red-600 font-semibold">कृपया इस नंबर पे कॉल ना करें अन्यथा नंबर ब्लॉक कर दिया जायेगा |</span></li>
            </ul>

            <div className="bg-white mt-4 rounded-md border px-4 py-4 flex flex-col items-center">
              <img
                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                alt="Profile"
                className="w-20 h-20 rounded-full mb-2"
              />
              <h3 className="font-semibold text-gray-900 mb-2">MPCPCT Support Team</h3>
              <button
                onClick={() => {
                  console.log("Message Me button clicked");
                  setIsModalOpen(true);
                }}
                className="bg-blue-500 cursor-pointer text-white px-4 py-2 rounded shadow hover:bg-blue-600 transition-colors"
                type="button"
              >
                Message Me
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mt-8 text-center">
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

