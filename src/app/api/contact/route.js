import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ContactSubmission from "@/lib/models/ContactSubmission";
import { sendMail } from "@/lib/email";

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    await dbConnect();
    const submission = await ContactSubmission.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : "",
      message: String(message).trim(),
      status: "new",
      emailSent: false,
    });

    // Prepare email content
    const subject = `Contact Form Submission from ${name}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          <p><strong>Message:</strong></p>
          <div style="background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin-top: 10px;">
            ${message.replace(/\n/g, "<br>")}
          </div>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          This email was sent from the MPCPCT contact form.
        </p>
      </div>
    `;

    let emailSent = false;
    try {
      const result = await sendMail({
        to: "mpcpct111@gmail.com",
        subject,
        html,
      });
      emailSent = !result.skipped;
      if (result.skipped) {
        console.warn("Email sending skipped - SMTP not configured");
      }
    } catch (emailError) {
      console.error("Contact form email error:", emailError);
    }

    if (emailSent) {
      await ContactSubmission.findByIdAndUpdate(submission._id, { emailSent: true });
    }

    return NextResponse.json(
      {
        success: true,
        message: emailSent
          ? "Your message has been sent successfully. We'll get back to you soon."
          : "Your message has been received. We'll get back to you soon.",
        warning: emailSent ? undefined : "Email service not configured",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

