import { useState } from 'react';
import { User, Shield, AlertCircle, UserPlus, Check, X, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types';
import { useNavigate } from 'react-router';
import wccLogo from '../../imports/image.png';

interface RegisterPageProps {
  onRegister: (user: UserType) => void;
  users: UserType[];
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

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_RULES.filter(r => r.test(pw)).length;
  if (passed <= 1) return { score: passed, label: 'Very Weak', color: 'bg-red-500' };
  if (passed === 2) return { score: passed, label: 'Weak', color: 'bg-orange-500' };
  if (passed === 3) return { score: passed, label: 'Fair', color: 'bg-yellow-500' };
  if (passed === 4) return { score: passed, label: 'Strong', color: 'bg-blue-500' };
  return { score: passed, label: 'Very Strong', color: 'bg-green-600' };
}

export function RegisterPage({ onRegister, users }: RegisterPageProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'admin' | 'staff',
    name: '',
    course: '',
    section: '',
    contact: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const strength = passwordStrength(formData.password);
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(formData.password));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Password strength enforcement
    if (!allRulesPassed) {
      setError('Password does not meet the security requirements listed below.');
      setLoading(false);
      setPasswordFocused(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Role-specific ID validation
    if (formData.role === 'admin' && !formData.id.startsWith('ADM')) {
      setError('Admin ID must start with "ADM".');
      setLoading(false);
      return;
    }
    if (formData.role === 'student' && !formData.id.match(/^\d{4}-\d{2}-\d{6}$/)) {
      setError('Student ID format: YYYY-MM-XXXXXX (e.g., 2024-07-001234).');
      setLoading(false);
      return;
    }
    if (formData.role === 'staff' && !formData.id.match(/^\d{4}-\d{2}-\d{5}$/)) {
      setError('Staff ID format: YYYY-MM-XXXXX (e.g., 2024-07-00123).');
      setLoading(false);
      return;
    }

    if (users.some(u => u.id === formData.id)) {
      setError('An account with this ID already exists.');
      setLoading(false);
      return;
    }

    const staffCount = users.filter(u => u.role === 'staff').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    if (formData.role === 'staff' && staffCount >= 2) {
      setError('Maximum of 2 Staff accounts allowed. Registration is closed for staff.');
      setLoading(false);
      return;
    }
    if (formData.role === 'admin' && adminCount >= 2) {
      setError('Maximum of 2 Admin accounts allowed. Registration is closed for admins.');
      setLoading(false);
      return;
    }
    if (formData.role === 'student' && (!formData.name || !formData.course || !formData.section || !formData.contact)) {
      setError('Students must provide Name, Course, Section, and Contact.');
      setLoading(false);
      return;
    }

    setTimeout(() => {
      const newUser: UserType = {
        id: formData.id,
        password: formData.password,
        role: formData.role,
        name: formData.name || formData.id,
        ...(formData.role === 'student' && {
          course: formData.course,
          section: formData.section,
          contact: formData.contact,
        }),
      };
      onRegister(newUser);
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/'), 2000);
    }, 500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl text-gray-800 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-4">Your account has been created.</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-4 shadow-lg p-2">
            <img src={wccLogo} alt="WCC Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-black mb-2">Equipment Borrowing and Tracking Return System</h1>
          <p className="text-blue-900">WCC - Create New Account</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <h2 className="text-2xl text-center mb-6 text-gray-800">Register Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block mb-2 text-sm text-gray-700">Account Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {(['student', 'staff', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, role })}
                    className={`py-3 px-4 rounded-lg border-2 transition-all ${
                      formData.role === role
                        ? 'border-blue-800 bg-blue-800 text-white'
                        : 'border-blue-300 bg-white text-blue-700 hover:border-blue-400'
                    }`}
                  >
                    <div className="capitalize">{role}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ID Number */}
            <div>
              <label htmlFor="id" className="block mb-2 text-sm text-gray-700">
                {formData.role === 'student' ? 'Student ID *' : formData.role === 'admin' ? 'Admin ID *' : 'Staff ID *'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="id"
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder={
                    formData.role === 'student' ? '2024-07-001234'
                    : formData.role === 'admin' ? 'ADM2024'
                    : '2024-07-00123'
                  }
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'student' && 'Format: YYYY-MM-XXXXXX'}
                {formData.role === 'admin' && 'Must start with "ADM"'}
                {formData.role === 'staff' && 'Format: YYYY-MM-XXXXX'}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block mb-2 text-sm text-gray-700">Full Name *</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                required
              />
            </div>

            {/* Student-specific fields */}
            {formData.role === 'student' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="course" className="block mb-2 text-sm text-gray-700">Course *</label>
                    <input
                      id="course"
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      placeholder="e.g., BSIT"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="section" className="block mb-2 text-sm text-gray-700">Section *</label>
                    <input
                      id="section"
                      type="text"
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      placeholder="e.g., 204"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact" className="block mb-2 text-sm text-gray-700">Contact Number *</label>
                  <input
                    id="contact"
                    type="text"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                    required
                  />
                </div>
              </>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block mb-2 text-sm text-gray-700">Password *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setPasswordFocused(true)}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {formData.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    strength.score <= 2 ? 'text-red-600' :
                    strength.score === 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    Password strength: <span className="font-semibold">{strength.label}</span>
                  </p>
                </div>
              )}

              {/* Password rules checklist */}
              {(passwordFocused || formData.password.length > 0) && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                  <p className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</p>
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(formData.password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {passed ? (
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${passed ? 'text-green-700' : 'text-gray-500'}`}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm text-gray-700">Confirm Password *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 ${
                    formData.confirmPassword.length > 0
                      ? formData.password === formData.confirmPassword
                        ? 'border-green-400'
                        : 'border-red-400'
                      : 'border-gray-300'
                  }`}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.confirmPassword.length > 0 && (
                <p className={`mt-1 text-xs ${
                  formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button onClick={() => navigate('/')} className="text-blue-800 hover:underline font-medium">
                Sign In
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-blue-900">
          <p>© 2026 Equipment Borrowing and Tracking Return System</p>
          <p className="text-xs text-blue-800 mt-1">Version 2.2.0 - WCC</p>
        </div>
      </div>
    </div>
  );
}
