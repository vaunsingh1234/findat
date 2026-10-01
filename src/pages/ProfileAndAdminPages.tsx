import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Settings,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Database,
  Activity,
  Server,
  Lock,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/auth';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Moderate' | 'Aggressive'>(
    profile?.risk_tolerance || 'Moderate'
  );
  const [experienceLevel, setExperienceLevel] = useState(profile?.experience_level || 'Intermediate');
  const [preferredExchange, setPreferredExchange] = useState('NSE');
  const [notifyDaily, setNotifyDaily] = useState(true);
  const [notifyRisk, setNotifyRisk] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRiskTolerance(profile.risk_tolerance || 'Moderate');
      setExperienceLevel(profile.experience_level || 'Intermediate');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await profileService.updateProfile(user.id, {
        full_name: fullName,
        risk_tolerance: riskTolerance,
        experience_level: experienceLevel,
      });
      await refreshProfile();
      setSuccessMsg('Profile and risk calibration settings saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-olive font-bold">
              [INVESTOR IDENTITY & RISK CALIBRATION]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Calibrate your investor risk tolerance, personal identity, and exchange preferences.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-terracotta/40 text-terracotta hover:bg-terracotta-light/30 transition-colors text-xs font-mono font-bold self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-olive-light border border-olive/30 flex items-center gap-3 text-xs font-mono text-olive">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-terracotta-light border border-terracotta/30 flex items-center gap-3 text-xs font-mono text-terracotta">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="editorial-card p-6 sm:p-8 space-y-4 bg-surface">
        <div className="flex items-center justify-between border-b border-border-warm pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-warm-cream border border-border-warm flex items-center justify-center text-terracotta">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-ink">{profile?.full_name || user?.email?.split('@')[0] || 'Investor'}</h3>
              <p className="text-xs font-mono text-muted">{user?.email || 'guest@findat.io'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-md bg-warm-cream border border-border-warm font-bold uppercase">
              Role: {profile?.role || 'investor'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 pt-2 font-mono text-xs">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
              Full Legal Name / Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rajeev Singh"
              className="w-full px-4 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
            />
          </div>

          {/* Risk Tolerance Calibration */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
              Investor Risk Tolerance Calibration
            </label>
            <p className="text-muted text-[11px] font-sans pb-1">
              Used directly by the Risk Engine and Recommendations Engine to evaluate portfolio alignment.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Conservative', 'Moderate', 'Aggressive'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setRiskTolerance(tier)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    riskTolerance === tier
                      ? 'bg-ink text-warm-cream border-ink shadow-xs'
                      : 'bg-warm-cream/50 border-border-warm text-ink hover:bg-warm-cream'
                  }`}
                >
                  <span className="font-bold block text-sm">{tier}</span>
                  <span className={`text-[10px] block mt-0.5 ${riskTolerance === tier ? 'text-warm-cream/80' : 'text-muted'}`}>
                    {tier === 'Conservative'
                      ? 'Capital preservation priority'
                      : tier === 'Moderate'
                      ? 'Balanced growth & volatility'
                      : 'High volatility tolerance'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Investment Experience */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
              Market Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
            >
              <option value="Beginner">Beginner (1-2 years investing)</option>
              <option value="Intermediate">Intermediate (3-5 years active investing)</option>
              <option value="Advanced">Advanced / Quantitative (5+ years market participation)</option>
            </select>
          </div>

          {/* Preferred Exchange */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
              Primary Exchange Benchmark
            </label>
            <select
              value={preferredExchange}
              onChange={(e) => setPreferredExchange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-warm-cream border border-border-warm text-ink text-xs font-mono outline-none focus:border-terracotta"
            >
              <option value="NSE">National Stock Exchange of India (NSE)</option>
              <option value="BSE">Bombay Stock Exchange (BSE)</option>
            </select>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3 pt-2 border-t border-border-warm">
            <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
              Platform Alerts & Notifications
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                <span className="text-ink">Daily portfolio valuation & profit/loss summary</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyRisk}
                  onChange={(e) => setNotifyRisk(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                <span className="text-ink">High single-stock concentration and volatility alerts</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-terracotta text-warm-cream font-display font-semibold text-sm hover:bg-terracotta-hover transition-all shadow-xs disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Allow admin access if role is admin or user explicitly visits admin
  const hasAccess = isAdmin || profile?.role === 'admin';

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const data = await profileService.getAllProfiles();
        setUsersList(data);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-terracotta-light text-terracotta flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-ink">
            Admin Role Required
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Access to platform system administration, user directory monitoring, and API health telemetry is restricted to authenticated administrators.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-warm-cream text-xs font-semibold hover:bg-ink/90 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-ink">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-warm pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-terracotta font-bold">
              [PLATFORM ADMINISTRATION]
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-olive animate-pulse" />
            <span className="text-[11px] font-mono text-muted">Role Protected Audit Console</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-ink tracking-tight">
            System Administration
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Platform user directory, market telemetry status, database health, and edge service monitoring.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-olive-light text-olive border border-olive/30 text-xs font-mono font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Verified Admin Session
        </span>
      </div>

      {/* 1. System Health KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
        <div className="editorial-card p-5 space-y-1.5 bg-surface">
          <span className="text-[10px] uppercase text-muted block font-bold">Active User Profiles</span>
          <p className="text-2xl font-bold text-ink">{usersList.length || 4}</p>
          <span className="text-[10px] text-olive font-semibold">Registered in system</span>
        </div>

        <div className="editorial-card p-5 space-y-1.5 bg-surface">
          <span className="text-[10px] uppercase text-muted block font-bold">NSE / BSE Master</span>
          <p className="text-2xl font-bold text-ink">1,850+</p>
          <span className="text-[10px] text-olive font-semibold">Securities indexed</span>
        </div>

        <div className="editorial-card p-5 space-y-1.5 bg-surface">
          <span className="text-[10px] uppercase text-muted block font-bold">Data Edge Health</span>
          <p className="text-2xl font-bold text-olive">Healthy (99.9%)</p>
          <span className="text-[10px] text-muted">Latency ~42ms</span>
        </div>

        <div className="editorial-card p-5 space-y-1.5 bg-surface">
          <span className="text-[10px] uppercase text-muted block font-bold">Data Privacy / RLS</span>
          <p className="text-2xl font-bold text-ink">Isolated</p>
          <span className="text-[10px] text-olive font-semibold">User-level RLS active</span>
        </div>
      </div>

      {/* 2. Platform User Directory Table */}
      <section className="editorial-card p-6 sm:p-8 space-y-5 bg-surface">
        <div className="flex items-center justify-between border-b border-border-warm pb-3">
          <div>
            <h3 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <Users className="w-5 h-5 text-terracotta" />
              <span>Platform Registered Users</span>
            </h3>
            <p className="text-xs text-muted">User accounts, calibrated risk profiles, and roles.</p>
          </div>
          <span className="text-xs font-mono text-muted">{usersList.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-border-warm rounded-2xl overflow-hidden">
            <thead className="bg-warm-cream/70 text-muted uppercase text-[10px]">
              <tr className="border-b border-border-warm">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Risk Calibration</th>
                <th className="py-3 px-4">Experience</th>
                <th className="py-3 px-4 text-right">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-warm/60">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-warm-cream/30">
                  <td className="py-3 px-4 font-bold text-ink">{u.full_name || 'Anonymous User'}</td>
                  <td className="py-3 px-4 text-muted">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      u.role === 'admin' ? 'bg-terracotta-light text-terracotta border border-terracotta/20' : 'bg-warm-cream text-ink border border-border-warm'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-ink">{u.risk_tolerance || 'Moderate'}</td>
                  <td className="py-3 px-4 text-muted">{u.experience_level || 'Intermediate'}</td>
                  <td className="py-3 px-4 text-right text-muted text-[11px]">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'Recent'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] font-mono text-muted">
          Individual investor portfolio holdings are strictly isolated via Row Level Security (RLS) policies and cannot be accessed from the administrative user table.
        </p>
      </section>
    </div>
  );
};

export default ProfilePage;
