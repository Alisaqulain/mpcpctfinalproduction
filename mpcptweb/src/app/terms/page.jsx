import { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | MPCPCT - User Agreement & Terms of Service",
  description:
    "Read MPCPCT's terms and conditions. Understand the rules, regulations, and user agreement for using our educational platform and services.",
  keywords:
    "terms and conditions, terms of service, user agreement, MPCPCT terms, legal terms, service agreement",
  openGraph: {
    title: "Terms & Conditions | MPCPCT",
    description: "Terms and conditions for using MPCPCT educational services",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms & Conditions</h1>
          <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using the MPCPCT website and services, you accept and agree to be bound by these Terms 
                and Conditions. If you do not agree to these terms, please do not use our services. These terms apply to 
                all users, including visitors, registered users, and subscribers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Services</h2>
              <p className="text-gray-700 leading-relaxed">
                MPCPCT provides digital educational services including but not limited to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Online courses and learning materials</li>
                <li>Exam preparation content and practice tests</li>
                <li>Skill development programs</li>
                <li>Subscription-based access to educational content</li>
                <li>Digital certificates and scorecards</li>
                <li>Typing practice and skill tests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Account Registration</h3>
              <p className="text-gray-700 leading-relaxed">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Account Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these terms or engage in 
                fraudulent, abusive, or illegal activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Payment Terms</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Pricing</h3>
              <p className="text-gray-700 leading-relaxed">
                All prices are displayed in Indian Rupees (INR) and are subject to change without notice. Prices 
                include applicable taxes unless stated otherwise.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Payment Processing</h3>
              <p className="text-gray-700 leading-relaxed">
                Payments are processed securely through Razorpay. By making a payment, you agree to Razorpay's terms 
                of service. We are not responsible for any issues arising from payment processing.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Refunds</h3>
              <p className="text-gray-700 leading-relaxed">
                Refund policies are outlined in our{" "}
                <Link href="/refund" className="text-indigo-600 hover:underline">
                  Refund Policy
                </Link>
                . Please review it before making a purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Our Content</h3>
              <p className="text-gray-700 leading-relaxed">
                All content on the MPCPCT platform, including text, graphics, logos, images, software, and course 
                materials, is the property of MPCPCT or its content suppliers and is protected by copyright and 
                intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Limited License</h3>
              <p className="text-gray-700 leading-relaxed">
                We grant you a limited, non-exclusive, non-transferable license to access and use our services for 
                personal, non-commercial educational purposes. You may not:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Copy, reproduce, or distribute our content without permission</li>
                <li>Modify, adapt, or create derivative works from our content</li>
                <li>Use our content for commercial purposes</li>
                <li>Remove any copyright or proprietary notices</li>
                <li>Share your account credentials with others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. User Conduct</h2>
              <p className="text-gray-700 leading-relaxed">You agree not to:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
                <li>Use automated systems to access the service without permission</li>
                <li>Share, sell, or transfer your account to others</li>
                <li>Engage in any activity that could harm our reputation or business</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are provided "as is" and "as available" without warranties of any kind, either express or 
                implied. We do not guarantee that:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>The service will be uninterrupted, secure, or error-free</li>
                <li>The results obtained from using the service will be accurate or reliable</li>
                <li>Any errors will be corrected</li>
                <li>The service will meet your specific requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                To the maximum extent permitted by law, MPCPCT shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including but not limited to loss of profits, data, or other 
                intangible losses, resulting from your use of our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless MPCPCT, its officers, directors, employees, and agents from 
                any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of 
                our services or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Modifications to Service</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of our service at any time, with or 
                without notice. We shall not be liable to you or any third party for any modification, suspension, or 
                discontinuation of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Third-Party Links</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service may contain links to third-party websites or services. We are not responsible for the 
                content, privacy policies, or practices of third-party websites. Your use of third-party services is 
                at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of India. 
                Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective 
                immediately upon posting on this page. Your continued use of our services after changes are posted 
                constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us:
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

