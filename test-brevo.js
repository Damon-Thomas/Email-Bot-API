import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function testBrevoEmail() {
  console.log("Testing Brevo SMTP connection...");

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    console.log("Sending test email...");
    const result = await transporter.sendMail({
      from: `Test Bot <${process.env.BREVO_FROM_EMAIL}>`,
      to: "damon.h.thomas@gmail.com",
      subject: "🧪 Direct Brevo Test",
      text: "This is a direct test of Brevo SMTP integration!",
      html: "<h2>🧪 Direct Brevo Test</h2><p>This is a <strong>direct test</strong> of Brevo SMTP integration!</p>",
    });

    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return { success: false, error: error.message };
  }
}

testBrevoEmail().then((result) => {
  console.log("\nFinal result:", result);
  process.exit(result.success ? 0 : 1);
});
