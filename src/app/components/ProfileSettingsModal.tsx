import { useState, useRef } from 'react';
import { X, Camera, User, Shield, Check, Eye, EyeOff, KeyRound, ImagePlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';

interface ProfileSettingsModalProps {
  user: UserType;
  onClose: () => void;
  onUpdateUser: (updated: UserType) => void;
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
  { label: 'Special character (!@#$%…)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function strengthLabel(pw: string) {
  const n = PASSWORD_RULES.filter(r => r.test(pw)).length;
  if (n <= 1) return { label: 'Very Weak', color: 'bg-red-500', text: 'text-red-600' };
  if (n === 2) return { label: 'Weak', color: 'bg-orange-500', text: 'text-orange-600' };
  if (n === 3) return { label: 'Fair', color: 'bg-yellow-500', text: 'text-yellow-600' };
  if (n === 4) return { label: 'Strong', color: 'bg-blue-500', text: 'text-blue-600' };
  return { label: 'Very Strong', color: 'bg-green-600', text: 'text-green-700' };
}

export function ProfileSettingsModal({ user, onClose, onUpdateUser }: ProfileSettingsModalProps) {
  const [tab, setTab] = useState<'profile' | 'password' | 'photo'>('profile');
  const [photoPreview, setPhotoPreview] = useState<string>(user.photoUrl || '');
  const [photoError, setPhotoError] = useState('');
  const [email, setEmail] = useState(user.email || '');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoTabFileRef = useRef<HTMLInputElement>(null);

  const strength = strengthLabel(newPw);
  const allRulesPassed = PASSWORD_RULES.every(r => r.test(newPw));

  const handleEmailChange = () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailError('');
    onUpdateUser({ ...user, email: normalizedEmail });
    setEmailSuccess(true);
    setTimeout(() => setEmailSuccess(false), 3000);
  };

  const handlePhotoChange = (file: File | null | undefined, onDone?: () => void) => {
    if (!file) return;
    setPhotoError('');
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, GIF, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPhotoPreview(url);
      onUpdateUser({ ...user, photoUrl: url });
      if (onDone) onDone();
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = () => {
    setPwError('');
    if (currentPw !== user.password) {
      setPwError('Current password is incorrect.');
      return;
    }
    if (!allRulesPassed) {
      setPwError('New password does not meet the security requirements.');
      setPwFocused(true);
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw === currentPw) {
      setPwError('New password must be different from the current password.');
      return;
    }
    onUpdateUser({ ...user, password: newPw });
    setPwSuccess(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const roleLabel = user.role === 'student' ? 'Student' : user.role === 'admin' ? 'Administrator' : 'Staff';
  const roleBadgeColor = user.role === 'admin' ? 'bg-red-100 text-red-800' : user.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 to-black text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">Account Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Summary Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200 flex items-center gap-4 flex-shrink-0">
          {/* Clickable Avatar */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg bg-gray-200 flex items-center justify-center group relative"
              title="Click to change photo"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-gray-500" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0])}
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
              <Camera className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-600 truncate">{user.id}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {[
            { id: 'profile', label: 'Profile Info', icon: User },
            { id: 'password', label: 'Change Password', icon: KeyRound },
            { id: 'photo', label: 'Profile Photo', icon: ImagePlus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as typeof tab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-blue-800 text-blue-900 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Profile Info Tab ── */}
          {tab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account Information</h3>

              <div className="flex flex-col gap-1">
                <label htmlFor="profile-email" className="text-xs text-gray-500 font-medium">Email Address</label>
                <div className="flex gap-2">
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    className="min-w-0 flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-800"
                    autoComplete="email"
                  />
                  <button onClick={handleEmailChange} className="px-3 py-2 bg-blue-800 text-white rounded-lg text-sm font-medium hover:bg-blue-900">
                    Save
                  </button>
                </div>
                {emailError && <p className="text-xs text-red-600">{emailError}</p>}
                {emailSuccess && <p className="text-xs text-green-600">Email updated successfully.</p>}
              </div>

              {[
                { label: 'Full Name', value: user.name },
                { label: user.role === 'student' ? 'Student ID' : user.role === 'admin' ? 'Admin ID' : 'Staff ID', value: user.id },
                { label: 'Role', value: roleLabel },
                ...(user.course ? [{ label: 'Course', value: user.course }] : []),
                ...(user.section ? [{ label: 'Section', value: user.section }] : []),
                ...(user.contact ? [{ label: 'Contact', value: user.contact }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                    {value}
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-400 pt-2">Your email and password changes are saved to the system database.</p>
            </div>
          )}

          {/* ── Change Password Tab ── */}
          {tab === 'password' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Change Password</h3>

              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Password changed successfully!
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Current Password</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPw}
                    onChange={(e) => { setCurrentPw(e.target.value); setPwError(''); }}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                  <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">New Password</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwError(''); }}
                    onFocus={() => setPwFocused(true)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= PASSWORD_RULES.filter(r => r.test(newPw)).length ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength.text}`}>Strength: <span className="font-semibold">{strength.label}</span></p>
                  </div>
                )}

                {/* Rules checklist */}
                {(pwFocused || newPw.length > 0) && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5">
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(newPw);
                      return (
                        <div key={rule.label} className="flex items-center gap-2">
                          {ok ? <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                          <span className={`text-xs ${ok ? 'text-green-700' : 'text-gray-500'}`}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }}
                    placeholder="Confirm new password"
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                      confirmPw.length > 0
                        ? newPw === confirmPw ? 'border-green-400' : 'border-red-400'
                        : 'border-gray-300'
                    }`}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPw.length > 0 && (
                  <p className={`mt-1 text-xs ${newPw === confirmPw ? 'text-green-600' : 'text-red-600'}`}>
                    {newPw === confirmPw ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {pwError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {pwError}
                </div>
              )}

              <button
                onClick={handlePasswordChange}
                disabled={!currentPw || !newPw || !confirmPw}
                className="w-full py-2.5 bg-gradient-to-r from-blue-800 to-black text-white rounded-lg hover:from-blue-900 hover:to-gray-900 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Update Password
              </button>
            </div>
          )}

          {/* ── Profile Photo Tab ── */}
          {tab === 'photo' && (
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Profile Photo</h3>

              {/* Current Photo Display */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-200 shadow-lg bg-gray-100 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  {photoPreview && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {photoPreview ? 'Current profile photo' : 'No profile photo uploaded'}
                </p>
              </div>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                onClick={() => photoTabFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handlePhotoChange(e.dataTransfer.files?.[0]);
                }}
              >
                <ImagePlus className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-blue-700 mb-1">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP — max 5 MB</p>
                <input
                  ref={photoTabFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </div>

              {photoError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {photoError}
                </div>
              )}

              {photoPreview && (
                <button
                  onClick={() => { setPhotoPreview(''); onUpdateUser({ ...user, photoUrl: '' }); }}
                  className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                >
                  Remove Photo
                </button>
              )}

              <p className="text-xs text-gray-400 text-center">
                Your photo is stored locally and visible only within this session.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
