import { VerifyEmailTemplate } from "@/components/EmailTemplates/verify-email";
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_KEY);

export async function POST(request: Request) {
  const { firstName, email, verificationUrl } = await request.json();

  if (!verificationUrl) {
    return new Response(JSON.stringify({ error: "Verification URL missing" }), { status: 400 });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "RxVision <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your email",
      react: VerifyEmailTemplate({ firstName, verificationUrl }),
    });

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
