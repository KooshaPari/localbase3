import React from 'react';
import SignInForm from '@/components/auth/SignInForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | LocalBase',
  description: 'Sign in to your LocalBase account',
};

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <SignInForm />
    </div>
  );
}
