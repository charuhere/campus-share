// Verify Email Page - Premium Design

import { Link } from 'react-router-dom';

function VerifyEmail() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="text-7xl mb-6 animate-float">📧</div>

                {/* Heading */}
                <h1 className="text-3xl font-bold text-white mb-4">
                    Check Your Email
                </h1>

                {/* Description */}
                <p className="text-gray-400 mb-8">
                    We've sent a verification link to your VIT email.
                    Click the link to verify your account and complete registration.
                </p>

                {/* Card */}
                <div className="glass-card p-6 mb-8">
                    <div className="space-y-3 text-left">
                        <div className="flex items-center gap-3 text-gray-300">
                            <span className="text-green-400">1.</span>
                            <span>Open your email inbox</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <span className="text-green-400">2.</span>
                            <span>Click the verification link</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <span className="text-green-400">3.</span>
                            <span>Come back and login</span>
                        </div>
                    </div>
                </div>

                {/* Login Link */}
                <Link
                    to="/login"
                    className="btn-gradient px-8 py-4 rounded-xl text-white font-semibold inline-block"
                >
                    Go to Login
                </Link>

                {/* Note */}
                <p className="text-gray-500 text-sm mt-6">
                    Didn't receive the email? Check your spam folder.
                </p>
            </div>
        </div>
    );
}

export default VerifyEmail;
