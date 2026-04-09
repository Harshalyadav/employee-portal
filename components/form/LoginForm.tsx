"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { setSession } from "@/lib/session";
import axiosInstance from "@/lib/axios";
import { useAppStore } from "@/stores";
import { getRole } from "@/service/role.service";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";


interface LoginFormProps {
  isLoading: boolean;
  error?: string | null;
  onSuccess?: () => void;
}

export function LoginForm({ isLoading, error, onSuccess }: LoginFormProps) {
  const OTP_LENGTH = 6;
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(z.object({ email: z.string().min(1, 'Email is required').email('Enter a valid email') })),
    mode: 'onSubmit',
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (step === 'otp') {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const requestOtp = async (data: { email: string }) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      await axiosInstance.post("/api/auth/send-otp", {
        email: data.email.trim().toLowerCase(),
      });
      setEmail(data.email.trim().toLowerCase());
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setStep('otp');
    } catch (error: any) {
      setOtpError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to send OTP. Try again.'
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async (otpValue: string) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      const response = await axiosInstance.post("/api/auth/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otpValue,
      });
      const payload = response.data?.data ?? response.data;
      const accessToken = payload?.access_token ?? payload?.accessToken;
      const refreshToken = payload?.refresh_token ?? payload?.refreshToken ?? "";
      let user = payload?.user;

      if (!accessToken) {
        throw new Error("Access token not found in response");
      }

      if (user && typeof user.roleId === "string" && !user.role) {
        try {
          const roleData = await getRole(user.roleId);
          user = { ...user, role: roleData };
        } catch {
          // Keep login working even if role hydration fails.
        }
      }

      setSession({
        accessToken,
        refreshToken,
        userId: user?.id || user?._id || "",
      });

      useAppStore.setState({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        user,
        loginType: payload?.loginType ?? null,
        error: null,
      });

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      onSuccess?.();
    } catch (error: any) {
      setOtpError(
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'OTP verification failed.'
      );
    } finally {
      setOtpLoading(false);
    }
  };


  // Email form submit
  const handleEmailSubmit = handleSubmit((formData) => {
    requestOtp(formData);
  });

  // OTP form submit
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otpDigits.join("");
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError(`Enter all ${OTP_LENGTH} digits`);
      return;
    }
    verifyOtp(otpValue);
  };

  const handleResendOtp = async () => {
    if (!email) return;
    await requestOtp({ email });
  };

  const renderFeedback = (message: string, variant: "error" | "info") => {
    const className =
      variant === "error"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-sky-200 bg-sky-50 text-sky-700";

    return (
      <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>
        {message}
      </div>
    );
  };

  return (
    <>
      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} noValidate>
          <CardContent className="mb-4 space-y-5 p-0 sm:space-y-6">
            <div className="rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50 to-white p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-sky-100 p-2 text-sky-700">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Passwordless Sign In</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Enter your registered email address and we will send a one-time passcode.
                  </p>
                </div>
              </div>
            </div>
            {error && renderFeedback(error, "error")}
            {otpError && renderFeedback(otpError, "error")}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm text-slate-700 sm:text-base">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isLoading || otpLoading}
                {...register('email')}
                autoComplete="email"
                className="h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-sm focus-visible:ring-sky-200"
              />
              {errors.email && (
                <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-0">
            <Button type="submit" className="h-12 w-full rounded-2xl bg-[#1f8fd5] text-base font-semibold hover:bg-[#1779b7]" disabled={isLoading || otpLoading}>
              {otpLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Use the same email that exists in your HRMS employee record.
            </p>
          </CardFooter>
        </form>
      )}
      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} noValidate>
          <CardContent className="mb-4 space-y-5 p-0 sm:space-y-6">
            <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Verify Your Identity</p>
                  <p className="mt-1 text-sm text-slate-600">
                    We sent a {OTP_LENGTH}-digit code to <span className="font-medium text-slate-900">{email}</span>.
                  </p>
                </div>
              </div>
            </div>
            {otpError && renderFeedback(otpError, "error")}
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-sm text-slate-700 sm:text-base">One-Time Passcode</Label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    ref={(element) => {
                      otpInputRefs.current[idx] = element;
                    }}
                    value={digit}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length > 1) return;
                      const newDigits = [...otpDigits];
                      newDigits[idx] = val;
                      setOtpDigits(newDigits);
                      if (val && idx < OTP_LENGTH - 1) {
                        otpInputRefs.current[idx + 1]?.focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                        otpInputRefs.current[idx - 1]?.focus();
                      }
                    }}
                    id={`otp-box-${idx}`}
                    className="h-14 w-11 rounded-2xl border border-slate-200 bg-white text-center text-xl font-semibold text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:w-12"
                    disabled={isLoading || otpLoading}
                    aria-label={`OTP digit ${idx + 1}`}
                  />
                ))}
              </div>
              {otpDigits.join("").length !== OTP_LENGTH && (
                <p className="text-xs sm:text-sm text-destructive">Enter all {OTP_LENGTH} digits</p>
              )}
            </div>
            {renderFeedback("Check your inbox and spam folder. The code expires in 5 minutes.", "info")}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-0">
            <Button type="submit" className="h-12 w-full rounded-2xl bg-[#1f8fd5] text-base font-semibold hover:bg-[#1779b7]" disabled={isLoading || otpLoading || otpDigits.join("").length !== OTP_LENGTH}>
              {otpLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            <div className="grid w-full grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11 rounded-2xl" onClick={() => setStep('email')} disabled={otpLoading}>
                <ArrowLeft className="h-4 w-4" />
                Change Email
              </Button>
              <Button type="button" variant="ghost" className="h-11 rounded-2xl" onClick={handleResendOtp} disabled={otpLoading}>
                Resend OTP
              </Button>
            </div>
          </CardFooter>
        </form>
      )}
    </>
  );
}
