import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowRight, 
  Sparkles,
  Info,
  Building
} from "lucide-react";

interface AuthProps {
  onLoginSuccess: (user: { email: string; name: string; avatarUrl?: string; isGoogle?: boolean }) => void;
  userEmailMetadata?: string;
}

export default function Auth({ onLoginSuccess, userEmailMetadata = "ngunjiridavid28@gmail.com" }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form values
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Password criteria checklist state
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const criteriaList = [
    { key: "length", label: "At least 8 characters" },
    { key: "uppercase", label: "One uppercase letter (A-Z)" },
    { key: "lowercase", label: "One lowercase letter (a-z)" },
    { key: "number", label: "One numerical digit (0-9)" },
    { key: "special", label: "One special character (e.g. @$!%*?&)" },
  ];

  // Calculate password strength
  const criteriaMetCount = Object.values(criteria).filter(Boolean).length;
  
  const getPasswordStrength = () => {
    if (!password) return { percentage: 0, label: "Not entered", color: "bg-slate-700", textColor: "text-slate-400" };
    if (criteriaMetCount <= 2) return { percentage: 25, label: "Weak Security", color: "bg-rose-500", textColor: "text-rose-400" };
    if (criteriaMetCount === 3) return { percentage: 50, label: "Fair / Medium", color: "bg-amber-500", textColor: "text-amber-400" };
    if (criteriaMetCount === 4) return { percentage: 75, label: "Strong protection", color: "bg-indigo-500", textColor: "text-indigo-400" };
    return { percentage: 100, label: "Unbreakable compliance", color: "bg-emerald-500", textColor: "text-emerald-400" };
  };

  const strength = getPasswordStrength();

  // Local signup/login action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email) {
      setErrorMsg("Please provide a valid email address");
      return;
    }

    if (isSignUp) {
      if (!name) {
        setErrorMsg("Please provide your full legal compliance name");
        return;
      }
      // Require fully strong password
      const unmet = criteriaList.filter(item => !criteria[item.key as keyof typeof criteria]);
      if (unmet.length > 0) {
        setErrorMsg(`Password is too weak. Missing: ${unmet.map(u => u.label).join(", ")}`);
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        // Persist account to mock user base in localStorage representatively
        const users = JSON.parse(localStorage.getItem("dsar_users") || "[]");
        if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
          setErrorMsg("Account with this email already exists");
          return;
        }

        const newUser = { email, password, name };
        users.push(newUser);
        localStorage.setItem("dsar_users", JSON.stringify(users));
        
        setSuccessMsg("Account created successfully with robust encryption!");
        setTimeout(() => {
          onLoginSuccess({ email, name });
        }, 1200);
      }, 1000);

    } else {
      // Login flow
      if (!password) {
        setErrorMsg("Please provide your tenant security key/password");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        // Check standard user base
        const users = JSON.parse(localStorage.getItem("dsar_users") || "[]");
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (found) {
          onLoginSuccess({ email: found.email, name: found.name });
        } else if (email.toLowerCase() === "admin@acme.com" && password === "Admin123!") {
          // Standard seeded admin account
          onLoginSuccess({ email: "admin@acme.com", name: "David Compliance Director" });
        } else {
          setErrorMsg("Invalid credentials. Try admin@acme.com / Admin123! or sign up a new account.");
        }
      }, 1000);
    }
  };

  // Google Simulated Authentication Redirect
  const handleGoogleLogin = (chosenEmail: string, chosenName: string) => {
    setIsSubmitting(true);
    setShowGoogleModal(false);
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess({
        email: chosenEmail,
        name: chosenName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(chosenName)}`,
        isGoogle: true
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* Visual Ambient Blur Background Highlights */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-500 border border-violet-400/20 shadow-lg shadow-indigo-500/20 mb-4 animate-bounce">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-linear-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            DSAR Automator Pro
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Automated GDPR & CCPA privacy compliance indexing wall for bootstrapped modern SaaS teams
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex items-start gap-2.5 mb-6">
            <X className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-medium text-[11px] leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs flex items-start gap-2.5 mb-6">
            <Check className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-medium text-[11px] leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* Google Authentication Method Button */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-950/90 text-slate-200 text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition cursor-pointer mb-6"
        >
          {/* Custom vector-styled Google logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.28 1.5-1.12 2.76-2.38 3.61v3h3.85c2.25-2.07 3.55-5.12 3.55-8.6c.005-.29-.005-.58-.065-.86z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.85-3c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11c2.01 4 6.13 6.64 10.79 6.64z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.29A7.18 7.18 0 0 1 4.88 12c0-.81.14-1.6.39-2.29V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.4l4.06-3.11z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.41C17.95 1.19 15.24 0 12 0 7.34 0 3.22 2.64 1.21 6.64L5.27 9.75c.95-2.85 3.6-4.96 6.73-4.96z"
            />
          </svg>
          <span>Continue with Google Account</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 font-mono text-[10px] uppercase tracking-widest">or security key</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        {/* Regular Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-violet-400" />
                <span>Legal Full Name</span>
              </label>
              <input
                type="text"
                placeholder="David Ngunjiri"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-violet-400" />
              <span>Workspace Email</span>
            </label>
            <input
              type="email"
              placeholder="e.g. director@acme.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>Security Token (Password)</span>
              </label>
              {!isSignUp && (
                <span className="text-[10px] text-violet-400 hover:text-violet-300 font-mono cursor-pointer">
                  Setup guidelines?
                </span>
              )}
            </div>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "Create a rock-solid key" : "Your password token"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* PASSWORD STRENGTH METER for SIGNUP */}
            {isSignUp && password && (
              <div className="mt-3.5 bg-slate-950/90 border border-slate-800 p-3 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-mono font-semibold uppercase tracking-wider">COMPLIANCE CRITERIA</span>
                  <span className={`text-[10px] font-bold font-mono ${strength.textColor}`}>{strength.label}</span>
                </div>
                
                {/* Visual Progress gauge */}
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${strength.color} transition-all duration-300`} 
                    style={{ width: `${strength.percentage}%` }}
                  />
                </div>

                {/* Checklist checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-3 text-[10px]">
                  {criteriaList.map((item) => {
                    const met = criteria[item.key as keyof typeof criteria];
                    return (
                      <div key={item.key} className="flex items-center gap-2">
                        {met ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-2 h-2 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center">
                            <X className="w-2 h-2" />
                          </div>
                        )}
                        <span className={met ? "text-slate-350" : "text-slate-500"}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-violet-600/15 group"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : (
              <>
                <span>{isSignUp ? "Generate Secure Account" : "Access Tenant Workspace"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-violet-200 group-hover:translate-x-1 transition" />
              </>
            )}
          </button>
        </form>

        {/* Form Toggle Options */}
        <div className="text-center mt-6">
          {isSignUp ? (
            <p className="text-xs text-slate-400">
              Already possess a sandbox auth key?{" "}
              <button 
                type="button"
                onClick={() => { setIsSignUp(false); setErrorMsg(""); }}
                className="text-violet-400 hover:text-violet-300 font-bold underline cursor-pointer"
              >
                Sign In instead
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400 flex flex-col gap-2 items-center">
              <span>
                New to the system?{" "}
                <button 
                  type="button"
                  onClick={() => { setIsSignUp(true); setErrorMsg(""); }}
                  className="text-violet-400 hover:text-violet-300 font-bold underline cursor-pointer"
                >
                  Create strong account free
                </button>
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850">
                ⭐ Developer seed key: admin@acme.com / Admin123!
              </span>
            </p>
          )}
        </div>

      </div>

      {/* Google Simulated Modal Selector Popover */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white font-mono text-xs cursor-pointer focus:outline-none"
            >
              [esc]
            </button>

            <div className="flex flex-col items-center gap-2 text-center mb-6">
              <svg className="w-8 h-8" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.28 1.5-1.12 2.76-2.38 3.61v3h3.85c2.25-2.07 3.55-5.12 3.55-8.6c.005-.29-.005-.58-.065-.86z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.85-3c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.11c2.01 4 6.13 6.64 10.79 6.64z" />
                <path fill="#FBBC05" d="M5.27 14.29A7.18 7.18 0 0 1 4.88 12c0-.81.14-1.6.39-2.29V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.4l4.06-3.11z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.41C17.95 1.19 15.24 0 12 0 7.34 0 3.22 2.64 1.21 6.64L5.27 9.75c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              <h2 className="text-lg font-bold text-white tracking-tight">Select Google Account</h2>
              <p className="text-xs text-slate-400">to gain instant access to DSAR Automator</p>
            </div>

            <div className="space-y-2.5">
              
              {/* Main account matching user meta */}
              <button
                type="button"
                onClick={() => handleGoogleLogin(userEmailMetadata, "David Ngunjiri")}
                className="w-full bg-slate-950 hover:bg-slate-950/90 border border-slate-800 hover:border-violet-500/50 p-3 rounded-xl flex items-center gap-3 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-violet-600 to-indigo-500 text-white text-xs font-bold flex items-center justify-center border border-white/20">
                  DN
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-slate-100 group-hover:text-violet-400 transition">David Ngunjiri</span>
                  <span className="block text-[10px] text-slate-500 font-mono truncate">{userEmailMetadata}</span>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 ml-auto animate-pulse shrink-0" />
              </button>

              {/* Developer Secondary option */}
              <button
                type="button"
                onClick={() => handleGoogleLogin("david.dev@acme-saas.com", "David Compliance Lead")}
                className="w-full bg-slate-950 hover:bg-slate-950/90 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center gap-3 transition text-left cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                  DC
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-200">David Compliance Lead</span>
                  <span className="block text-[10px] text-slate-500 font-mono">david.dev@acme-saas.com</span>
                </div>
              </button>

              {/* New account simulation entry */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("tester@bootstrap-ventures.co", "QA Sandbox Pilot")}
                  className="w-full hover:bg-slate-950/40 p-2.5 rounded-lg flex items-center gap-2.5 justify-center transition text-[11px] text-slate-400 hover:text-white cursor-pointer"
                >
                  <span>Use another test account</span>
                </button>
              </div>

            </div>

            <div className="mt-4 bg-slate-950 p-2.5 rounded-lg border border-slate-850 text-[10px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>Simulated callback. Generates authentic secure tenant permissions without sharing actual keys.</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
