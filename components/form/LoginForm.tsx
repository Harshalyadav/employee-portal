"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/stores/actions/auth.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";


interface LoginFormProps {
  isLoading: boolean;
  error?: string | null;
  onSuccess?: () => void;
}

export function LoginForm({ isLoading, error, onSuccess }: LoginFormProps) {
  const OTP_LENGTH = 4;
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  // OTP login state and logic
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(step === 'email' ? z.object({ email: z.string().min(1, 'Email is required').email('Enter a valid email') }) : z.object({ email: z.string().email(), otp: z.string().min(4, 'OTP is required') })),
    mode: 'onSubmit',
    defaultValues: { email: '', otp: '' },
  });

  // Simulate API call for OTP request
  const requestOtp = async (data: { email: string }) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      // TODO: Replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      setEmail(data.email);
      setOtpSent(true);
      setStep('otp');
    } catch (e) {
      setOtpError('Failed to send OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // Simulate API call for OTP verification
  const verifyOtp = async (data: { email: string; otp: string }) => {
    setOtpLoading(true);
    setOtpError(null);
    try {
      // TODO: Replace with real API call
      await new Promise((res) => setTimeout(res, 1000));
      // Simulate OTP check
      if (data.otp === '1234') {
        console.log('OTP verified, calling onSuccess');
        onSuccess?.();
      } else {
        setOtpError('Invalid OTP');
      }
    } catch (e) {
      setOtpError('OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = (formData: any) => {
    if (step === 'email') {
      requestOtp(formData);
    } else {
      // Join OTP digits for verification
      const otpValue = otpDigits.join("");
      verifyOtp({ email, otp: otpValue });
    }
  };



  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardContent className="space-y-4 sm:space-y-5 mb-4 p-0">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}
        {otpError && (
          <div className="rounded-md bg-destructive/10 p-3 sm:p-4 text-sm text-destructive border border-destructive/20">
            {otpError}
          </div>
        )}
        {step === 'email' && (
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              disabled={isLoading || otpLoading}
              {...register('email')}
              autoComplete="email"
              className="h-10 sm:h-11 text-base"
            />
            {errors.email && (
              <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        )}
        {step === 'otp' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm sm:text-base">Enter OTP</Label>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0' }}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length > 1) return;
                      const newDigits = [...otpDigits];
                      newDigits[idx] = val;
                      setOtpDigits(newDigits);
                      // Move to next box if filled
                      if (val && idx < OTP_LENGTH - 1) {
                        const next = document.getElementById(`otp-box-${idx + 1}`);
                        if (next) (next as HTMLInputElement).focus();
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                        const prev = document.getElementById(`otp-box-${idx - 1}`);
                        if (prev) (prev as HTMLInputElement).focus();
                      }
                    }}
                    id={`otp-box-${idx}`}
                    style={{
                      width: '3rem',
                      height: '3rem',
                      fontSize: '2rem',
                      textAlign: 'center',
                      border: '1px solid #bdbdbd',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      background: '#fff',
                    }}
                    disabled={isLoading || otpLoading}
                  />
                ))}
              </div>
              {otpDigits.join("").length !== OTP_LENGTH && (
                <p className="text-xs sm:text-sm text-destructive">Enter all {OTP_LENGTH} digits</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">OTP sent to {email}</div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 p-0">
        <Button type="submit" className="w-full h-11 sm:h-12 text-base" disabled={isLoading || otpLoading}>
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
              {step === 'email' ? 'Sending OTP...' : 'Verifying...'}
            </>
          ) : (
            step === 'email' ? 'Send OTP' : 'Verify OTP'
          )}
        </Button>
        {step === 'otp' && (
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('email')} disabled={otpLoading}>
            Change Email
          </Button>
        )}
      </CardFooter>
    </form>
  );
}
