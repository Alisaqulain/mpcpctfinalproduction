import { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | MPCPCT - Data Protection & Privacy",
  description:
    "Read MPCPCT's comprehensive privacy policy. Learn how we collect, use, protect, and manage your personal information and data security.",
  keywords:
    "privacy policy, data protection, MPCPCT privacy, personal information, data security, GDPR, user privacy",
  openGraph: {
    title: "Privacy Policy | MPCPCT",
    description: "How MPCPCT protects and manages your personal information",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                MPCPCT ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you visit our website and use our 
                digital educational services. Please read this policy carefully to understand our practices regarding 
                your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Name and contact information (email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Educational background and preferences</li>
                <li>Exam results and performance data</li>
                <li>Subscription and purchase history</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed">We automatically collect certain information when you use our services:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website addresses</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed">We use the collected information for the following purposes:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>To provide, maintain, and improve our educational services</li>
                <li>To process payments and manage subscriptions</li>
                <li>To personalize your learning experience</li>
                <li>To send you updates, newsletters, and promotional materials (with your consent)</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To analyze usage patterns and improve our website</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To comply with legal obligations and enforce our terms of service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing and Disclosure</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Third-Party Service Providers</h3>
              <p className="text-gray-700 leading-relaxed">
                We may share your information with trusted third-party service providers who assist us in operating our 
                website and conducting our business, including:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li><strong>Payment Processors:</strong> Razorpay for secure payment processing</li>
                <li><strong>Hosting Services:</strong> Cloud service providers for website hosting</li>
                <li><strong>Analytics Services:</strong> Google Analytics for website usage analysis</li>
                <li><strong>Email Services:</strong> Email service providers for communication</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                These third parties are contractually obligated to protect your information and use it only for the 
                purposes we specify.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 leading-relaxed">
                We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure password storage using hashing algorithms</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Secure payment processing through PCI-DSS compliant gateways</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we 
                strive to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our website and store certain 
                information. Cookies are files with a small amount of data that are sent to your browser from a website 
                and stored on your device.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, 
                if you do not accept cookies, you may not be able to use some portions of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed">You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request access to your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</li>
                <li><strong>Objection:</strong> Object to processing of your personal information</li>
                <li><strong>Data Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent for marketing communications</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at <strong>Mpcpct111@gmail.com</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this 
                Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer 
                need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our services are not intended for children under the age of 13. We do not knowingly collect personal 
                information from children under 13. If you are a parent or guardian and believe your child has provided 
                us with personal information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and maintained on computers located outside of your state, 
                province, country, or other governmental jurisdiction where data protection laws may differ. By using 
                our services, you consent to the transfer of your information to facilities located outside your jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this 
                Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
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

