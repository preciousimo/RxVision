"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyEmail, checkIfAlreadyVerified } from "@/lib/actions/user.actions";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { CircleCheckBig, AlertCircle } from "lucide-react";

const VerifyEmailPage: React.FC = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid" | "expired" | "already_verified">("loading");
  const [message, setMessage] = useState<string>("");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (token) {
        try {
          const result = await verifyEmail(token);
          if (result.status === 'success') {
            setStatus('success');
            setMessage(result.message);
            // Redirect after a short delay
            setTimeout(() => router.push("/auth-page/signin"), 3000);
          } else if (result.status === 'not_found') {
            // Check if it's because the email was already verified
            const alreadyVerified = await checkIfAlreadyVerified(token);
            if (alreadyVerified) {
              setStatus('already_verified');
              setMessage("This email has already been verified.");
            } else {
              setStatus('invalid');
              setMessage(result.message);
            }
          } else {
            setStatus(result.status === 'expired' ? 'expired' : 'error');
            setMessage(result.message);
          }
        } catch (error) {
          console.error("Error verifying email:", error);
          setStatus("error");
          setMessage("An unexpected error occurred");
        }
      } else {
        setStatus("invalid");
        setMessage("No verification token provided");
      }
    };

    verifyUserEmail();
  }, [token, router]);

  return (
    <DefaultLayout>
      <div className="mt-20 h-screen text-center">
        <span className="mt-15 inline-block">
          {status === "success" || status === "already_verified" ? 
            <CircleCheckBig size={60} className="text-green-500" /> : 
            <AlertCircle size={60} className="text-red-500" />
          }
        </span>
        <p>{message}</p>
        {status === "loading" && <p>Verifying your email, please wait...</p>}
        {status === "success" && <p>Redirecting to sign in page...</p>}
        {(status === "invalid" || status === "expired") && (
          <button
            onClick={() => router.push("/auth-page/signup")}
            className="mt-4 rounded-lg bg-primary p-3 text-white"
          >
            Go to Sign Up
          </button>
        )}
        {(status === "success" || status === "already_verified") && (
          <button
            onClick={() => router.push("/auth-page/signin")}
            className="mt-4 rounded-lg bg-primary p-3 text-white"
          >
            Go to Sign In
          </button>
        )}
      </div>
    </DefaultLayout>
  );
};

export default VerifyEmailPage;