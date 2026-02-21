import { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Refund Policy | MPCPCT - Cancellation & Refund Policy",
  description:
    "Read our comprehensive refund and cancellation policy for MPCPCT digital services, courses, exams, and subscriptions. Understand your rights and our refund process.",
  keywords:
    "refund policy, cancellation policy, MPCPCT refund, course refund, subscription refund, digital services refund",
  openGraph: {
    title: "Refund Policy | MPCPCT",
    description: "Comprehensive refund and cancellation policy for MPCPCT services",
    type: "website",
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Refund & Cancellation Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                At MPCPCT, we are committed to providing high-quality digital educational services including courses, 
                exam preparation materials, and subscription-based learning content. This Refund & Cancellation Policy 
                outlines the terms and conditions under which refunds may be processed for our digital services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Digital Services - No Physical Products</h2>
              <p className="text-gray-700 leading-relaxed">
                MPCPCT provides exclusively digital services including:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Online courses and learning materials</li>
                <li>Exam preparation content and practice tests</li>
                <li>Skill development programs</li>
                <li>Subscription-based access to educational content</li>
                <li>Digital certificates and scorecards</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Since all our services are digital and delivered instantly upon purchase, please review this policy carefully 
                before making a purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Refund Eligibility</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Refund Requests</h3>
              <p className="text-gray-700 leading-relaxed">
                Refund requests must be submitted within <strong>7 days</strong> of the purchase date. 
                Refund requests submitted after this period will not be considered.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Eligible Refund Scenarios</h3>
              <p className="text-gray-700 leading-relaxed">Refunds may be considered in the following cases:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Technical issues preventing access to purchased content that cannot be resolved within 48 hours</li>
                <li>Duplicate payment for the same service</li>
                <li>Unauthorized transaction on your account</li>
                <li>Service not delivered as described (subject to verification)</li>
                <li>Payment made by mistake (must be reported within 24 hours)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Non-Refundable Scenarios</h3>
              <p className="text-gray-700 leading-relaxed">Refunds will NOT be provided in the following cases:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Change of mind after accessing the content</li>
                <li>Failure to meet exam requirements or expectations</li>
                <li>Expired subscription periods</li>
                <li>Violation of terms of service</li>
                <li>Refund request submitted after 7 days from purchase</li>
                <li>Content accessed or downloaded more than 25% of the total content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Refund Process</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 How to Request a Refund</h3>
              <p className="text-gray-700 leading-relaxed">To request a refund, please:</p>
              <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-700">
                <li>Contact our support team via email at <strong>Mpcpct111@gmail.com</strong></li>
                <li>Include your payment transaction ID or order number</li>
                <li>Provide a detailed reason for the refund request</li>
                <li>Include any relevant screenshots or documentation</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Refund Processing Time</h3>
              <p className="text-gray-700 leading-relaxed">
                Once your refund request is approved:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Refund processing will begin within 3-5 business days</li>
                <li>Refund amount will be credited to your original payment method within 7-14 business days</li>
                <li>For payments made via UPI, bank transfer, or other methods, processing may take up to 21 business days</li>
                <li>You will receive email confirmation once the refund is processed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Cancellation Policy</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Subscription Cancellations</h3>
              <p className="text-gray-700 leading-relaxed">
                You may cancel your subscription at any time. However:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Cancellation will take effect at the end of your current billing period</li>
                <li>You will continue to have access to the service until the end of the paid period</li>
                <li>No partial refunds will be provided for unused subscription time</li>
                <li>To cancel, contact us at <strong>Mpcpct111@gmail.com</strong> or through your account settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Course Cancellations</h3>
              <p className="text-gray-700 leading-relaxed">
                Once a course is purchased and accessed, it cannot be cancelled unless it meets the refund eligibility 
                criteria mentioned in Section 3.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Payment Gateway Refunds</h2>
              <p className="text-gray-700 leading-relaxed">
                All payments are processed securely through Razorpay. Refunds will be processed through the same payment 
                method used for the original transaction. If the original payment method is no longer available, we will 
                work with you to arrange an alternative refund method.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                For refund requests, questions, or concerns regarding this policy, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> Mpcpct111@gmail.com
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phone:</strong> 8989966753
                </p>
                <p className="text-gray-700">
                  <strong>Website:</strong>{" "}
                  <Link href="https://www.mpcpct.com" className="text-indigo-600 hover:underline">
                    www.mpcpct.com
                  </Link>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Policy Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                MPCPCT reserves the right to modify this Refund & Cancellation Policy at any time. Changes will be 
                effective immediately upon posting on this page. We encourage you to review this policy periodically 
                to stay informed about our refund and cancellation procedures.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                This Refund & Cancellation Policy is governed by the laws of India. Any disputes arising from refund 
                requests will be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="inline-block text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

