import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff, Check, X } from 'lucide-react';
import { User } from '../types';
import wccLogo from '../../imports/image.png';

interface ForgotPasswordPageProps {
  users: User[];
  onUpdateUser: (updated: User) => void;
}

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Uppercase letter (A–Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Lowercase letter (a–z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'At least one number (0–9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'Special character (!@#$%^&*…)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function ForgotPasswordPage({ users, onUpdateUser }: ForgotPasswordPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [pwFocused, setPwFocused] = useState(false);

  const allRulesPassed = PASSWORD_RULES.every(r => r.test(newPassword));

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        setUserToReset(user);
        setStep('reset');
        setSuccess('Email verified! Please enter your new password.');
      } else {
        setError('Email address not found. Please check your school email and try again.');
      }
      setLoading(false);
    }, 800);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!allRulesPassed) {
      setError('Password does not meet the security requirements listed below.');
      setPwFocused(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      if (userToReset) {
        // Persist via the live state handler — no direct mutation
        onUpdateUser({ ...userToReset, password: newPassword });
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-4 shadow-lg p-2">
            <img src={wccLogo} alt="WCC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-black mb-2">Forgot Password</h1>
          <p className="text-blue-900">Reset your account password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {step === 'email' && (
            <>
              <h2 className="text-2xl text-center mb-6 text-gray-800">Verify Your Email</h2>
              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block mb-2 text-sm text-gray-700">School Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Enter the email address associated with your account</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="text-2xl text-center mb-2 text-gray-800">Create New Password</h2>
              <p className="text-center text-sm text-gray-500 mb-6">
                Resetting for: <span className="text-gray-700">{userToReset?.name}</span>
              </p>
              <form onSubmit={handlePasswordReset} className="space-y-5">
                <div>
                  <label htmlFor="newPassword" className="block mb-2 text-sm text-gray-700">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="newPassword"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setPwFocused(true)}
                      placeholder="Enter new password"
                      className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {(pwFocused || newPassword.length > 0) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                      <p className="text-xs text-gray-600 mb-2">Password Requirements:</p>
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(newPassword);
                        return (
                          <div key={rule.label} className="flex items-center gap-2">
                            {passed ? <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                            <span className={`text-xs ${passed ? 'text-green-700' : 'text-gray-500'}`}>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block mb-2 text-sm text-gray-700">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                        confirmPassword.length > 0 ? (newPassword === confirmPassword ? 'border-green-400' : 'border-red-400') : 'border-gray-300'
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <p className={`mt-1 text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-blue-900">
          <p>© 2026 Equipment Borrowing and Tracking Return System</p>
          <p className="text-xs text-blue-800 mt-1">Version 2.2.0 - WCC</p>
        </div>
      </div>
    </div>
  );
}
