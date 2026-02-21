import { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata = {
  title: "Contact Us | MPCPCT - Get in Touch with Support Team",
  description:
    "Contact MPCPCT support team for questions, suggestions, feedback, or technical assistance. Email: Mpcpct111@gmail.com | Phone: 8989966753",
  keywords:
    "contact MPCPCT, MPCPCT support, customer service, help desk, contact information, support team",
  openGraph: {
    title: "Contact Us | MPCPCT",
    description: "Get in touch with MPCPCT support team",
    type: "website",
  },
};

export default function ContactUs() {
  return <ContactContent />;
}
