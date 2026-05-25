import React, { useState } from "react";
import { 
  Database, 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle, 
  Info, 
  Lock, 
  Layers 
} from "lucide-react";
import { WorkspaceConfig } from "../types";

interface OnboardingProps {
  config: WorkspaceConfig;
  onComplete: (updated: WorkspaceConfig) => void;
}

export default function Onboarding({ config, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState(config.name);
  const [domain, setDomain] = useState(config.domain);
  const [gdprChecked, setGdprChecked] = useState(true);
  const [ccpaChecked, setCcpaChecked] = useState(true);

  // Supabase connection simulation
  const [supabaseUrl, setSupabaseUrl] = useState(config.supabaseUrl);
  const [supabaseKey, setSupabaseKey] = useState(config.supabaseServiceRole);
  const [sbConnecting, setSbConnecting] = useState(false);
  const [sbSuccess, setSbSuccess] = useState(config.supabaseConnected);

  // Firebase connection simulation
  const [firebaseProject, setFirebaseProject] = useState(config.firebaseProjectId);
  const [fbCreds, setFbCreds] = useState(config.firebaseServiceAccount);
  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(config.firebaseConnected);

  const handleTestSupabase = () => {
    if (!supabaseUrl || !supabaseKey) return;
    setSbConnecting(true);
    setTimeout(() => {
      setSbConnecting(false);
      setSbSuccess(true);
    }, 1200);
  };

  const handleTestFirebase = () => {
    if (!firebaseProject || !fbCreds) return;
    setFbConnecting(true);
    setTimeout(() => {
      setFbConnecting(false);
      setFbSuccess(true);
    }, 1200);
  };

  const handleFinish = () => {
    onComplete({
      ...config,
      name: companyName,
      domain: domain,
      supabaseUrl,
      supabaseServiceRole: supabaseKey,
      supabaseConnected: sbSuccess,
      firebaseProjectId: firebaseProject,
      firebaseServiceAccount: fbCreds,
      firebaseConnected: fbSuccess,
    });
  };

  return (
    <div id="onboarding-step-wizard" className="max-w-xl mx-auto my-12 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Progress Line */}
      <div className="h-1 bg-slate-800 w-full relative">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-400 mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Onboarding Wizard &bull; Step {step} of 3</span>
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight text-white">
            {step === 1 && "Configure Your Compliance Profile"}
            {step === 2 && "Securely Bridge Supabase"}
            {step === 3 && "Securely Bridge Firebase Auth & Firestore"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {step === 1 && "Establish your Multi-Tenant tenant workspace values & jurisdiction frameworks."}
            {step === 2 && "Authenticate with your target database. We will scan user profiles in real-time."}
            {step === 3 && "Integrate Firebase Admin permissions to support user profile purge actions."}
          </p>
        </div>

        {/* STEP 1: Core details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="company-name-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Company Name</label>
              <input
                id="company-name-input"
                type="text"
                placeholder="e.g. Acme Corporation"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="domain-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Application Domain</label>
              <input
                id="domain-input"
                type="text"
                placeholder="e.g. acme-corp.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t border-slate-800/80">
              <span className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">Active Jurisdiction Regimes</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="gdpr-toggle-button"
                  type="button"
                  onClick={() => setGdprChecked(!gdprChecked)}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition ${
                    gdprChecked 
                      ? "bg-slate-950/80 border-blue-500/40 text-white" 
                      : "bg-slate-950/20 border-slate-800 text-slate-500"
                  }`}
                >
                  <div>
                    <span className="block text-sm font-semibold">GDPR Compliant</span>
                    <span className="block text-[10px] text-slate-500">30-day resolution window</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={gdprChecked} 
                    onChange={() => {}} 
                    className="accent-blue-500" 
                  />
                </button>
                <button
                  id="ccpa-toggle-button"
                  type="button"
                  onClick={() => setCcpaChecked(!ccpaChecked)}
                  className={`flex items-center justify-between p-3.5 rounded-lg border text-left transition ${
                    ccpaChecked 
                      ? "bg-slate-950/80 border-blue-500/40 text-white" 
                      : "bg-slate-950/20 border-slate-800 text-slate-500"
                  }`}
                >
                  <div>
                    <span className="block text-sm font-semibold">CCPA/CPRA Compliant</span>
                    <span className="block text-[10px] text-slate-500">15-day Opt-out response</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={ccpaChecked} 
                    onChange={() => {}} 
                    className="accent-blue-500" 
                  />
                </button>
              </div>
            </div>

            <button
              id="onboarding-to-step2-btn"
              type="button"
              disabled={!companyName || !domain}
              onClick={() => setStep(2)}
              className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <span>Bridge Integrations</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Supabase connection settings */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-[#3ECF8E] mb-3">
                <Database className="w-5 h-5" />
                <span className="text-sm font-semibold">Supabase PostgreSQL Target Engine</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                Supply your backend project credentials. These remain deeply encrypted at rest inside our PostgreSQL storage engine. We use the service role key strictly to scan target relational trees for user identity emails.
              </p>
            </div>

            <div>
              <label htmlFor="supabase-url-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Supabase API URL</label>
              <input
                id="supabase-url-input"
                type="text"
                placeholder="https://your-proj-id.supabase.co"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="supabase-key-input" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Supabase Service Role Secret Key</label>
              <input
                id="supabase-key-input"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX... (Service Role Key)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#3ECF8E]"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                id="test-supabase-credentials-btn"
                type="button"
                onClick={handleTestSupabase}
                disabled={!supabaseUrl || !supabaseKey || sbConnecting}
                className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-[#3ECF8E]/40 font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {sbConnecting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                    <span>Scanning schemas...</span>
                  </>
                ) : sbSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#3ECF8E]" />
                    <span className="text-[#3ECF8E]">Authenticated Securely</span>
                  </>
                ) : (
                  <span>Test API Connection</span>
                )}
              </button>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                id="onboarding-back-to-step1-btn"
                type="button"
                onClick={() => setStep(1)}
                className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 font-medium text-sm py-2.5 px-4 rounded-lg transition"
              >
                Back
              </button>
              <button
                id="onboarding-to-step3-btn"
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <span>Setup Firebase Target</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Firebase Admin Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-[#FFCA28] mb-3">
                <Flame className="w-5 h-5" />
                <span className="text-sm font-semibold">Firebase Web SDK & Firestore Admin IAM</span>
              </div>
              <p className="text-xs text-slate-400 mb-4 bg-slate-950 p-3 rounded-lg border border-slate-800">
                Upload or paste your JSON secret service key configuration to delete users programmatically from Firebase Authentication and target user Firestore paths recursively.
              </p>
            </div>

            <div>
              <label htmlFor="firebase-project-id" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Firebase Project ID</label>
              <input
                id="firebase-project-id"
                type="text"
                placeholder="acme-prod-b0e21"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#FFCA28]"
                value={firebaseProject}
                onChange={(e) => setFirebaseProject(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="firebase-credentials" className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1.5">Private Service Account JSON Key File</label>
              <textarea
                id="firebase-credentials"
                rows={4}
                placeholder=" { &quot;type&quot;: &quot;service_account&quot;, &quot;private_key&quot;: &quot;-----BEGIN PRIVATE KEY----- ... &quot; }"
                className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-[#FFCA28]"
                value={fbCreds}
                onChange={(e) => setFbCreds(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                id="test-firebase-credentials-btn"
                type="button"
                onClick={handleTestFirebase}
                disabled={!firebaseProject || !fbCreds || fbConnecting}
                className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 hover:border-[#FFCA28]/40 font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {fbConnecting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                    <span>Validating credentials...</span>
                  </>
                ) : fbSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#FFCA28]" />
                    <span className="text-[#FFCA28]">Admin Credentials Saved</span>
                  </>
                ) : (
                  <span>Validate Firebase Node IAM</span>
                )}
              </button>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
              <button
                id="onboarding-back-to-step2-btn"
                type="button"
                onClick={() => setStep(2)}
                className="bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 font-medium text-sm py-2.5 px-4 rounded-lg transition"
              >
                Back
              </button>
              <button
                id="complete-onboarding-btn"
                type="button"
                onClick={handleFinish}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Initialize Platform Dashboard</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
