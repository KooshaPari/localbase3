import React from 'react';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | LocalBase',
  description: 'Reset your LocalBase account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ForgotPasswordForm />
    </div>
  );
}
