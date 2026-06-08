import { generatePageMetadata } from "@/lib/metadata";

export const metadata = generatePageMetadata({
  title: "Verify Phone",
  description: "Verify your mobile number to access MPCPCT courses and videos.",
  path: "/verify-phone",
  noindex: true,
});

export default function VerifyPhoneLayout({ children }) {
  return children;
}
