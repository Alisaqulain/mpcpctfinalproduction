import { Metadata } from "next";

export const metadata = {
  title: "FAQ - Frequently Asked Questions | MPCPCT",
  description:
    "Find answers to frequently asked questions about MPCPCT - CPCT, RSCIT, and CCC exam preparation platform. Learn about subscriptions, features, and more.",
  keywords:
    "MPCPCT FAQ, frequently asked questions, CPCT exam help, RSCIT questions, CCC exam support",
  openGraph: {
    title: "FAQ - Frequently Asked Questions | MPCPCT",
    description: "Find answers to frequently asked questions about MPCPCT",
    type: "website",
  },
};

export default function FAQPage() {
  const faqs = [
    {
      question: "What is MPCPCT?",
      answer:
        "MPCPCT is an online platform designed to help you prepare for CPCT, RSCIT, and CCC exams. We provide typing practice, computer proficiency tests, and exam preparation materials.",
    },
    {
      question: "How do I create an account?",
      answer:
        "You can create an account by clicking on the 'Sign Up' button on our homepage. You'll need to provide your name, email, phone number, and create a password.",
    },
    {
      question: "What subscription plans are available?",
      answer:
        "We offer various subscription plans including monthly, quarterly, and annual options. You can also purchase subscriptions for specific content types like Learning, Skill Test, or Exam Mode. Visit our pricing page for detailed information.",
    },
    {
      question: "How do I access PDF notes and syllabus?",
      answer:
        "PDF notes and syllabus PDFs are available to users with active subscriptions. Once you have a membership, your administrator will assign PDF notes and syllabus materials to your account. You can access them from the Download menu.",
    },
    {
      question: "Can I practice typing in Hindi?",
      answer:
        "Yes! MPCPCT supports both Hindi and English typing practice. You can practice typing in Hindi using different keyboard layouts like Remington Gail and Inscript.",
    },
    {
      question: "What is the CPCT exam?",
      answer:
        "CPCT (Computer Proficiency Certification Test) is a government exam that tests your computer proficiency and typing skills. The scorecard is valid for 7 years from the date of exam.",
    },
    {
      question: "How do I contact support?",
      answer:
        "You can contact us via email at Mpcpct111@gmail.com or call us at 8989966753. We typically respond within 24 hours.",
    },
    {
      question: "Can I get a refund?",
      answer:
        "Please refer to our refund policy page for detailed information about our refund and cancellation policy.",
    },
    {
      question: "Do you have a mobile app?",
      answer:
        "Yes, we have a mobile app available. You can find download links and more information in the 'Our App' section of our website.",
    },
    {
      question: "How do I track my progress?",
      answer:
        "You can track your progress through your profile page, which shows your exam results, typing speed improvements, and learning achievements.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-[#290c52]">
          Frequently Asked Questions (FAQ)
        </h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-[#290c52] mb-2">
                {faq.question}
              </h2>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-2">
            Still have questions? We're here to help!
          </p>
          <a
            href="/contact-us"
            className="text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}
