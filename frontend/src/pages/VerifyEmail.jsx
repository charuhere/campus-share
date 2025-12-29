// Verify Email Page - Uber Style

import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md w-full">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-white" />
                </div>

                {/* Heading */}
                <h1 className="text-3xl font-bold text-black mb-4">
                    Check Your Email
                </h1>

                {/* Description */}
                <p className="text-gray-600 mb-8">
                    We've sent a verification link to your VIT email.
                    Click the link to verify your account.
                </p>

                {/* Card */}
                <div className="glass-card p-6 mb-8 text-left">
                    <div className="space-y-4">
                        <StepItem number="1" text="Open your email inbox" />
                        <StepItem number="2" text="Click the verification link" />
                        <StepItem number="3" text="Come back and login" />
                    </div>
                </div>

                {/* Login Link */}
                <Link
                    to="/login"
                    className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                    Go to Login
                    <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Note */}
                <p className="text-gray-500 text-sm mt-6">
                    Didn't receive the email? Check your spam folder.
                </p>
            </div>
        </div>
    );
}

function StepItem({ number, text }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">
                {number}
            </div>
            <span className="text-gray-700 font-medium">{text}</span>
        </div>
    );
}

export default VerifyEmail;
