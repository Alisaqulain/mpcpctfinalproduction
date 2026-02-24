import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#3b157a] text-white px-6 py-10 text-sm">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Return & Refund Policy */}
        <div
          className="h-[300px] overflow-y-scroll pr-2"
          style={{
            scrollbarWidth: "none",      // Firefox
            msOverflowStyle: "none"      // IE & Edge
          }}
        >
          <style>{`
            /* Chrome, Safari, Opera */
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          <h3 className="text-lg font-semibold mb-4">Return & Refund Policy</h3>
          <div className="text-gray-300 space-y-2 text-sm leading-relaxed">
            <p>1. The customers have <strong>7 days</strong> to check their purchases.</p>
            <p>2. If a customer is unsatisfied with the products, they must return them within <strong>7 days</strong> of the purchase. <strong>MPCPCT</strong> will refund all your money without any questions.</p>
            <p>3. The products must be returned within <strong>7 days</strong> under the following conditions:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>The condition of the purchase must be the same as it was at the time of purchase</li>
              <li>It must contain all tags</li>
              <li>It must not be damaged</li>
              <li>The customer must bring the purchase receipt</li>
            </ul>
            <p>4. After fourteen days of the purchase or not fulfilling any of the conditions provided in clause 3, <strong>MPCPCT</strong> shall not accept any return, and no money will be refunded.</p>
            <p>5. For more information regarding return and refund policy, please contact us.</p>
            <p className="mt-3">Thank you for choosing <strong>MPCPCT</strong>!</p>
          </div>
        </div>

        {/* Copyright */}
        <div>
          <h3 className="text-lg font-semibold mb-4">© Copyright - <span className="font-mono text-lg">MPCPCT</span></h3>
          <p className="text-gray-300">
            © 2025 <span className="font-mono">MPCPCT</span>. All rights reserved. The content, design, and materials on this website—including text, graphics, logos, and software—are the property of <span className="font-mono">MPCPCT</span> and protected under Indian and international copyright laws.
          </p>
          <p className="italic text-gray-400 mt-2">
            Unauthorized reproduction, distribution, or modification without prior written permission is strictly prohibited. For inquiries, contact us.
          </p>
          
          {/* Developer Credit - Added in a professional way */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs">
              Developed by <span className="text-yellow-300 font-medium"><a href="https://robustwebsolution.com/">Robust Web Solution</a></span>
            </p>
          </div>
        </div>

        {/* Exam Hub */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Exam Preparation Hub</h3>
          <div className="grid grid-cols-2 gap-4">
            {["CPCT", "LDC", "SSC", "RSCIT"].map((exam) => (
              <div
                key={exam}
                className="flex items-center justify-center border border-gray-500 rounded-full px-3 py-5 bg-black"
              >
                <a href="/exam">
                  <div className="text-center">
                    <span className="block text-lg mt-1">{exam}</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Policy Links */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-700">
        <h3 className="text-white font-semibold mb-4">Legal & Policies</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <a href="/refund" className="text-gray-300 hover:text-white hover:underline">
            Cancellation & Refunds
          </a>
          <span className="text-gray-600">|</span>
          <a href="/terms" className="text-gray-300 hover:text-white hover:underline">
            Terms and Conditions
          </a>
          <span className="text-gray-600">|</span>
          <a href="/shipping" className="text-gray-300 hover:text-white hover:underline">
            Shipping
          </a>
          <span className="text-gray-600">|</span>
          <a href="/privacy" className="text-gray-300 hover:text-white hover:underline">
            Privacy
          </a>
          <span className="text-gray-600">|</span>
          <a href="/contact-us" className="text-gray-300 hover:text-white hover:underline">
            Contact Us
          </a>
        </div>
      </div>

      {/* Mobile Enquiry */}
      <div className="max-w-7xl mx-auto mt-10">
        <h3 className="text-white font-semibold mb-2">Mobile Enquiry</h3>
        <div className="flex w-full max-w-md rounded-full overflow-hidden">
          <input
            type="text"
            placeholder="Enter Mobile"
            className="w-full px-4 py-2 text-white bg-[#3b157a] outline-none focus:ring-2 focus:ring-orange-400"
          />
          <button className="bg-orange-400 px-6 py-2 text-black font-semibold">
            Send
          </button>
        </div>
      </div>

      {/* Social Media */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-gray-700">
        <h3 className="text-white font-semibold mb-4">Follow Us</h3>
        <div className="flex items-center gap-4">
          <a
            href="https://www.instagram.com/mpcpct/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            aria-label="Follow us on Instagram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-sm">Instagram</span>
          </a>
        </div>
      </div>
    </footer>
  );
}