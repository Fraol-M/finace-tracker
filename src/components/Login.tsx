import React, { useState } from "react";
import { UserAccount } from "../types";
import { Shield, UserPlus, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { validateEmail, validatePhone, validatePassword, validateUsername } from "../utils/validation";
import { apiFetch } from "../api/client";

interface LoginProps {
  onLoginSuccess: (user: UserAccount, token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [fullName, setFullName] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPass, setSignupPass] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [signupSuccess, setSignupSuccess] = useState("");

  const hasLoginUserSpace = /\s/.test(loginUser);

  const isFullNameValid = fullName.trim().length > 0;
  const isUsernameValid = validateUsername(signupUsername);
  const isEmailValid = validateEmail(signupEmail);
  const isPhoneValid = validatePhone(signupPhone);
  const isPasswordValid = validatePassword(signupPass);
  const isConfirmValid = signupConfirm === signupPass && signupConfirm !== "";
  const canSignup = isFullNameValid && isUsernameValid && isEmailValid && isPhoneValid && isPasswordValid && isConfirmValid;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (hasLoginUserSpace) {
      setLoginError("Credentials cannot contain spaces");
      return;
    }

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: loginUser,
          password: loginPass,
        }),
      });
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setLoginError(err.message || "Invalid username/email or password");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSignup) return;

    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName,
          username: signupUsername,
          email: signupEmail,
          phone: signupPhone,
          password: signupPass,
        }),
      });

      setSignupSuccess(`Account created! You can now log in with "${signupUsername}"`);

      // Clear signup form
      setFullName("");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPhone("");
      setSignupPass("");
      setSignupConfirm("");
    } catch (err: any) {
      alert(err.message || "Signup failed");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#131313] text-[#e5e2e1] flex items-center justify-center p-6 overflow-hidden select-none font-sans">
      {/* Dynamic ambient lights background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#4edea3]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#c487ff]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* LOGIN FORM PANEL */}
        <div className="flex-1 bg-[#1e1e1e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-8 flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-[#4edea3] w-6 h-6" />
              <span className="text-[#4edea3] font-mono text-xs uppercase tracking-widest font-semibold">Secure Portal</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-[#4edea3]" id="login-title-h1">
              Login
            </h1>
            <p className="text-[#bbcabf] text-sm">Access your secure financial portal.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4" id="loginFormReact">
            {loginError && (
              <div className="bg-red-950/40 border border-[#ffb4ab]/30 p-3 rounded-lg text-[#ffb4ab] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="relative">
              <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1.5">Email / Username</label>
              <input
                type="text"
                className={`w-full bg-[#161616] border rounded-lg px-4 py-2.5 text-sm text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                  loginUser === "" ? "border-white/5" : hasLoginUserSpace ? "border-[#ffb4ab] focus:ring-1 focus:ring-[#ffb4ab]" : "border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]"
                }`}
                placeholder="Enter admin or kaleb"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value.replace(/\s/g, ""))}
                required
              />
              {hasLoginUserSpace && (
                <div className="text-[#ffb4ab] text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Username/Email cannot contain spaces
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1.5">Password</label>
              <input
                type="password"
                className={`w-full bg-[#161616] border rounded-lg px-4 py-2.5 text-sm text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                  loginPass === "" ? "border-white/5" : "border-[#4edea3] focus:ring-1 focus:ring-[#4edea3]"
                }`}
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center my-1 text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#161616] border-white/5 text-[#4edea3] focus:ring-0 focus:ring-offset-0 focus:outline-none w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#bbcabf]">Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Access accounts via standard testing credentials:\n- Admin: log in with username 'admin', password 'admin'\n- User: log in with username 'kaleb', password 'user'");
                }}
                className="text-xs text-[#4edea3] hover:underline"
              >
                Forgot?
              </a>
            </div>

            <button
              type="submit"
              disabled={loginUser.trim() === "" || loginPass.trim() === "" || hasLoginUserSpace}
              className="w-full bg-[#4edea3] text-[#003824] font-semibold py-2.5 rounded-lg hover:bg-[#6ffbbe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              Login
            </button>
          </form>

          <div className="mt-6 border-t border-white/5 pt-4">
            <h4 className="text-xs font-mono uppercase text-[#bbcabf]/50 mb-2 font-semibold">TIPS FOR EVALUATING ACCESS VIEWS:</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#bbcabf]">
              <div className="bg-[#111111]/80 rounded p-2 border border-white/5">
                <p className="font-semibold text-[#4edea3]">Admin Account</p>
                <p>
                  Username: <code className="font-bold text-white bg-slate-800 px-1 rounded">admin</code>
                </p>
                <p>
                  Password: <code className="font-bold text-white bg-slate-800 px-1 rounded">admin</code>
                </p>
              </div>
              <div className="bg-[#111111]/80 rounded p-2 border border-white/5">
                <p className="font-semibold text-[#4edea3]">User Account (Kaleb)</p>
                <p>
                  Username: <code className="font-bold text-white bg-slate-800 px-1 rounded">kaleb</code>
                </p>
                <p>
                  Password: <code className="font-bold text-white bg-slate-800 px-1 rounded">user</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SIGN UP FORM PANEL */}
        <div className="flex-1 bg-[#1e1e1e]/60 backdrop-blur-xl border border-white/5 rounded-xl p-8 flex flex-col justify-center transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="text-white w-6 h-6" />
              <span className="text-[#bbcabf] font-mono text-xs uppercase tracking-widest font-semibold">Join Ledger</span>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-white" id="signup-title-h2">
              Sign Up
            </h2>
            <p className="text-[#bbcabf] text-sm">Create an account to begin managing your wealth.</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-3" id="signupFormReact">
            {signupSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-lg text-[#4edea3] text-xs flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{signupSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Full Name</label>
                <input
                  type="text"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    fullName === "" ? "border-white/5" : "border-[#4edea3]"
                  }`}
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Username</label>
                <input
                  type="text"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    signupUsername === "" ? "border-white/5" : isUsernameValid ? "border-[#4edea3]" : "border-[#ffb4ab]"
                  }`}
                  placeholder="johndoe"
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  required
                />
                {signupUsername !== "" && !isUsernameValid && <div className="text-[#ffb4ab] text-[10px] mt-0.5">No spaces are allowed in username.</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Email</label>
                <input
                  type="email"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    signupEmail === "" ? "border-white/5" : isEmailValid ? "border-[#4edea3]" : "border-[#ffb4ab]"
                  }`}
                  placeholder="john@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
                {signupEmail !== "" && !isEmailValid && <div className="text-[#ffb4ab] text-[10px] mt-0.5">Invalid email format.</div>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    signupPhone === "" ? "border-white/5" : isPhoneValid ? "border-[#4edea3]" : "border-[#ffb4ab]"
                  }`}
                  placeholder="+1 (555) 000-0000"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                />
                {signupPhone !== "" && !isPhoneValid && <div className="text-[#ffb4ab] text-[10px] mt-0.5">Invalid phone characters.</div>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Password</label>
                <input
                  type="password"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    signupPass === "" ? "border-white/5" : isPasswordValid ? "border-[#4edea3]" : "border-[#ffb4ab]"
                  }`}
                  placeholder="••••••••"
                  value={signupPass}
                  onChange={(e) => setSignupPass(e.target.value)}
                  required
                />
                <div className="text-[10px] text-[#bbcabf] mt-1 flex items-center gap-1 leading-tight opacity-70">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>8+ chars, 1 number, 1 special</span>
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-mono text-[#bbcabf] mb-1">Confirm Password</label>
                <input
                  type="password"
                  className={`w-full bg-[#161616] border rounded-lg px-3 py-2 text-xs text-[#e5e2e1] focus:outline-none transition-all placeholder:text-[#bbcabf]/30 ${
                    signupConfirm === "" ? "border-white/5" : isConfirmValid ? "border-[#4edea3]" : "border-[#ffb4ab]"
                  }`}
                  placeholder="••••••••"
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  required
                />
                {signupConfirm !== "" && !isConfirmValid && <div className="text-[#ffb4ab] text-[10px] mt-0.5">Passwords do not match.</div>}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSignup}
              className="w-full bg-transparent border border-[#4edea3] text-[#4edea3] py-2 rounded-lg hover:bg-[#4edea3]/10 font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs mt-3 cursor-pointer"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
