import React from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | LocalBase',
  description: 'Set a new password for your LocalBase account',
};

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <ResetPasswordForm />
    </div>
  );
}
