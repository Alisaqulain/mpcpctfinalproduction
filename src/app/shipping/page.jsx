import { Metadata } from "next";
import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy | MPCPCT - Digital Services Delivery",
  description:
    "Learn about MPCPCT's shipping and delivery policy for digital educational services. Instant access to courses, exams, and subscription content.",
  keywords:
    "shipping policy, delivery policy, digital delivery, instant access, MPCPCT delivery, online courses delivery",
  openGraph: {
    title: "Shipping & Delivery Policy | MPCPCT",
    description: "Digital services delivery policy for MPCPCT educational platform",
    type: "website",
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Delivery Policy</h1>
          <p className="text-gray-600 mb-8">Last Updated: {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

          <div className="prose prose-lg max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                MPCPCT provides exclusively <strong>digital educational services</strong> and does not ship any 
                physical products. All our services, including courses, exam preparation materials, subscriptions, 
                and learning content, are delivered digitally through our online platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Digital Service Delivery</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Instant Access</h3>
              <p className="text-gray-700 leading-relaxed">
                Upon successful payment confirmation, you will receive <strong>instant access</strong> to your 
                purchased digital services. There is no shipping time or delivery delay as all content is available 
                immediately through your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 Access Methods</h3>
              <p className="text-gray-700 leading-relaxed">Your digital content is accessible through:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Your MPCPCT user account dashboard</li>
                <li>Web browser on desktop or mobile devices</li>
                <li>Direct links provided via email confirmation</li>
                <li>Mobile-responsive platform (no app download required)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Delivery Confirmation</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Email Confirmation</h3>
              <p className="text-gray-700 leading-relaxed">
                After successful payment, you will receive an email confirmation at the email address associated with 
                your account. This email will include:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Order confirmation and transaction details</li>
                <li>Access instructions and login credentials</li>
                <li>Direct links to your purchased content</li>
                <li>Payment receipt and invoice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Account Activation</h3>
              <p className="text-gray-700 leading-relaxed">
                Your purchased services will be automatically activated in your account. You can access them immediately 
                by logging into your MPCPCT account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Service Delivery Timeline</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Delivery Time: Instant</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Courses & Learning Materials:</strong> Immediate access upon payment confirmation</li>
                  <li><strong>Exam Subscriptions:</strong> Activated instantly in your account</li>
                  <li><strong>Practice Tests:</strong> Available immediately after purchase</li>
                  <li><strong>Skill Development Programs:</strong> Access granted instantly</li>
                  <li><strong>Digital Certificates:</strong> Available after course/exam completion</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. System Requirements</h2>
              <p className="text-gray-700 leading-relaxed">
                To access and use our digital services, you need:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>A device with internet connectivity (computer, tablet, or smartphone)</li>
                <li>A modern web browser (Chrome, Firefox, Safari, Edge, or Opera)</li>
                <li>An active MPCPCT user account</li>
                <li>Stable internet connection for streaming content</li>
                <li>JavaScript enabled in your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Subscription Services</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Subscription Activation</h3>
              <p className="text-gray-700 leading-relaxed">
                For subscription-based services, access begins immediately upon payment confirmation and continues for 
                the duration of your subscription period.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 Renewal Access</h3>
              <p className="text-gray-700 leading-relaxed">
                If you renew your subscription, continued access is granted immediately upon payment processing. 
                There is no interruption in service for active renewals.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Access Issues & Support</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.1 Troubleshooting</h3>
              <p className="text-gray-700 leading-relaxed">
                If you experience any issues accessing your purchased content:
              </p>
              <ol className="list-decimal pl-6 mt-4 space-y-2 text-gray-700">
                <li>Verify that you are logged into the correct account</li>
                <li>Check your email for the confirmation and access instructions</li>
                <li>Clear your browser cache and cookies</li>
                <li>Try accessing from a different browser or device</li>
                <li>Contact our support team if issues persist</li>
              </ol>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">7.2 Support Response Time</h3>
              <p className="text-gray-700 leading-relaxed">
                Our support team aims to respond to access-related inquiries within <strong>24 hours</strong> during 
                business days. For urgent issues, please contact us via phone.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. No Physical Shipping</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Important:</strong> MPCPCT does not ship any physical products, including:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2 text-gray-700">
                <li>Books, study materials, or printed content</li>
                <li>Certificates or documents via postal mail</li>
                <li>Hardware or physical devices</li>
                <li>Merchandise or promotional items</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                All certificates, scorecards, and documents are provided in digital format and can be downloaded 
                directly from your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Access</h2>
              <p className="text-gray-700 leading-relaxed">
                Our digital services are accessible from anywhere in the world with an internet connection. There are 
                no geographical restrictions or shipping limitations. All content is delivered instantly regardless of 
                your location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Payment Processing & Delivery</h2>
              <p className="text-gray-700 leading-relaxed">
                Payment processing is handled securely through Razorpay. Once your payment is confirmed (usually within 
                seconds), your account is automatically updated with access to the purchased services. In rare cases 
                where payment verification takes longer, access will be granted within 24 hours of payment confirmation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about delivery or access to your purchased services, please contact us:
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
                <p className="text-gray-700 mt-4">
                  <strong>Support Hours:</strong> Monday to Saturday, 9:00 AM - 6:00 PM IST
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

