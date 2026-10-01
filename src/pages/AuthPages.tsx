import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Sliders,
} from 'lucide-react';
import { authService } from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await authService.login({ email: 'demo@findat.io', password: 'demo' });
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const isUserNotFound = error && error.toLowerCase().includes('no account found');

  return (
    <div className="min-h-[85vh] bg-warm-cream py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-terracotta text-warm-cream font-display font-extrabold text-2xl shadow-sm mb-1">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
            Sign In to Fin<span className="text-terracotta">Dat</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Institutional portfolio tracking and Indian market analytics.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface p-7 sm:p-8 rounded-3xl border border-border-warm shadow-xs space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-terracotta-light border border-terracotta/30 text-ink text-xs space-y-2">
              <div className="flex items-center gap-2 text-terracotta font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {isUserNotFound && (
                <div className="pt-1">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 font-bold text-terracotta hover:underline"
                  >
                    Click here to create an account <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@domain.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all placeholder:text-muted/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-muted hover:text-terracotta transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all placeholder:text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-3 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-warm-cream font-display font-semibold text-sm shadow-xs transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-warm-cream border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-warm" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider text-muted">
              <span className="bg-surface px-3">or instant access</span>
            </div>
          </div>

          {/* Quick Demo Sign In */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-surface-warm hover:bg-clay-light border border-border-warm text-ink font-mono text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {demoLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-mustard" />
            )}
            <span>Sign In as Demo Investor</span>
          </button>
        </div>

        {/* Footer Link to Register */}
        <p className="text-center text-xs text-muted">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-terracotta hover:underline">
            Create an Investor Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');
  const [experienceLevel, setExperienceLevel] = useState('Intermediate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide an email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.register({
        email,
        password,
        fullName: fullName.trim() || undefined,
        riskTolerance,
        experienceLevel,
      });

      // Redirect to Dashboard
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyRegistered = error && error.toLowerCase().includes('already exists');

  return (
    <div className="min-h-[85vh] bg-warm-cream py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-terracotta text-warm-cream font-display font-extrabold text-2xl shadow-sm mb-1">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
            Create Investor Account
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Configure risk tolerance profile and manage Indian equity portfolios.
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface p-7 sm:p-8 rounded-3xl border border-border-warm shadow-xs space-y-5">
          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-terracotta-light border border-terracotta/30 text-ink text-xs space-y-2">
              <div className="flex items-center gap-2 text-terracotta font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {isAlreadyRegistered && (
                <div className="pt-1">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-bold text-terracotta hover:underline"
                  >
                    Click here to Sign In now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Rajeev Singh"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all placeholder:text-muted/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@domain.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all placeholder:text-muted/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all placeholder:text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Risk Tolerance Profile Selection */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-terracotta" />
                <span>Risk Tolerance Profile</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { key: 'Conservative', label: 'Conservative', desc: 'Low Volatility' },
                    { key: 'Moderate', label: 'Moderate', desc: 'Balanced Growth' },
                    { key: 'Aggressive', label: 'Aggressive', desc: 'High Alpha / Beta' },
                  ] as const
                ).map((tier) => (
                  <button
                    key={tier.key}
                    type="button"
                    onClick={() => setRiskTolerance(tier.key)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      riskTolerance === tier.key
                        ? 'bg-ink text-warm-cream border-ink shadow-xs'
                        : 'bg-warm-cream border-border-warm text-muted hover:text-ink hover:border-ink/40'
                    }`}
                  >
                    <div className="font-display font-bold text-xs">{tier.label}</div>
                    <div className="text-[10px] font-mono opacity-80">{tier.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-olive" />
                <span>Market Experience</span>
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-xs font-mono font-semibold outline-none focus:border-terracotta"
              >
                <option value="Beginner">Beginner (1-2 years in Indian Equities)</option>
                <option value="Intermediate">Intermediate (3-5 years portfolio experience)</option>
                <option value="Advanced">Advanced (Institutional / Derivative experience)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-warm-cream font-display font-semibold text-sm shadow-xs transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-warm-cream border-t-transparent rounded-full animate-spin" />
                  <span>Setting Up Portfolio Environment...</span>
                </>
              ) : (
                <>
                  <span>Create Investor Account</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link to Login */}
        <p className="text-center text-xs text-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-terracotta hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send recovery instructions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-warm-cream py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-terracotta text-warm-cream font-display font-extrabold text-2xl shadow-sm mb-1">
            F
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-ink tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Enter your account email to receive recovery instructions.
          </p>
        </div>

        <div className="bg-surface p-7 sm:p-8 rounded-3xl border border-border-warm shadow-xs space-y-5">
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-olive-light text-olive flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-ink">Recovery Link Dispatched</h3>
                <p className="text-xs text-muted">
                  If an account exists for <span className="font-mono font-semibold text-ink">{email}</span>, password reset instructions have been sent.
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-terracotta hover:underline pt-2"
              >
                Return to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-terracotta-light border border-terracotta/30 text-ink text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-terracotta shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-ink">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@domain.com"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-warm-cream rounded-xl border border-border-warm text-ink text-sm outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-terracotta hover:bg-terracotta-hover text-warm-cream font-display font-semibold text-sm shadow-xs transition-all active:scale-98 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Sending Instructions...' : 'Send Recovery Instructions'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-terracotta hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
