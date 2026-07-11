import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { Sparkles, Mail, Lock, ShieldAlert, ArrowRight, CheckCircle } from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (userEmail: string, userId: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user && result.user.email) {
        onLoginSuccess(result.user.email, result.user.uid);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password) {
      setErrorMsg("Por favor, rellena todos los campos.");
      setLoading(false);
      return;
    }

    try {
      if (isResetPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg("Se ha enviado un enlace de recuperación a tu correo electrónico.");
      } else if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (cred.user && cred.user.email) {
          onLoginSuccess(cred.user.email, cred.user.uid);
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user && cred.user.email) {
          onLoginSuccess(cred.user.email, cred.user.uid);
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-credential") {
        setErrorMsg("Credenciales inválidas. Por favor, revisa tus datos.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMsg("Este correo ya está registrado en System Lab.");
      } else if (err.code === "auth/weak-password") {
        setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setErrorMsg(err.message || "Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col md:flex-row items-stretch justify-center text-white font-sans selection:bg-purple-600 selection:text-white">
      {/* Left Branding Panel */}
      <div className="flex-1 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 md:p-16 flex flex-col justify-between border-r border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.08),transparent_50%)]" />
        
        {/* Brand */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-neutral-100 to-purple-400 bg-clip-text text-transparent tracking-tight">
              SYSTEM LAB
            </h1>
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">SaaS IA Studio</span>
          </div>
        </div>

        {/* Feature list */}
        <div className="my-12 max-w-lg z-10 space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Plataforma SaaS para crear Landings de <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Alta Conversión</span>
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Genera automáticamente copys persuasivos, banners profesionales personalizados por IA, y estructuras visuales con un solo clic.
          </p>

          <div className="space-y-3.5 pt-4">
            {[
              "Creación rápida de productos y ofertas comerciales",
              "Redacción persasiva optimizada por Claude (IA)",
              "Diseño de banners de alta resolución adaptados a formato",
              "Landing Builder visual interactivo y control de versiones"
            ].map((text, i) => (
              <div key={i} className="flex items-start space-x-3 text-sm text-neutral-300">
                <CheckCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Developer Disclaimer */}
        <div className="text-neutral-500 text-xs border-t border-neutral-800/60 pt-4 z-10">
          Desarrollado de forma nativa e integrada en Google AI Studio. 
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full md:w-[480px] p-8 md:p-16 flex flex-col justify-center bg-neutral-950 shrink-0">
        <div className="w-full max-w-sm mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {isResetPassword ? "Recuperar Acceso" : isRegister ? "Crear Cuenta Pro" : "Iniciar Sesión"}
          </h3>
          <p className="text-xs text-neutral-400 mt-1.5 mb-8">
            Ingresa al laboratorio de inteligencia artificial.
          </p>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start space-x-2.5 text-xs text-red-400 mb-6">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl flex items-start space-x-2.5 text-xs text-green-400 mb-6">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-all duration-200"
                />
              </div>
            </div>

            {!isResetPassword && (
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-800 focus:border-purple-600 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Reset Password trigger */}
            {!isRegister && !isResetPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {isResetPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsResetPassword(false)}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Volver a iniciar sesión
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-500/10 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
            >
              <span>{loading ? "Procesando..." : isResetPassword ? "Enviar Enlace" : isRegister ? "Registrar Cuenta" : "Entrar a System Lab"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute w-full border-t border-neutral-800/80" />
            <span className="relative px-3 bg-neutral-950 text-[10px] uppercase font-mono tracking-widest text-neutral-500">O ingresa con</span>
          </div>

          {/* Google Login button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-neutral-900 font-semibold rounded-xl text-sm flex items-center justify-center space-x-3 transition-colors duration-150 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.69 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.45 7.55l3.8 2.95c.9-2.7 3.42-4.46 6.75-4.46z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.8-.07-1.56-.2-2.3H12v4.35h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.65 2.84c2.14-1.97 3.37-4.88 3.37-8.16z"
              />
              <path
                fill="#FBBC05"
                d="M5.25 14.5c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.45 7.55C.52 9.4 0 11.4 0 13.5s.52 4.1 1.45 5.95l3.8-2.95z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.08 7.96-2.92l-3.65-2.84c-1.01.68-2.3 1.08-4.31 1.08-3.33 0-5.85-1.76-6.75-4.46l-3.8 2.95C3.37 20.35 7.35 23 12 23z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Toggle Register/Login */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              {isRegister ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate gratis"}
            </button>
          </div>

          {/* Instructions Tip */}
          <div className="mt-8 p-3 bg-neutral-900/60 border border-neutral-800/80 rounded-xl">
            <p className="text-[10px] leading-relaxed text-neutral-500">
              <strong className="text-purple-400">Consejo técnico:</strong> Google Auth está totalmente integrado y activo. Si decides registrarte por correo electrónico, asegúrate de que el proveedor "Email/Password" esté habilitado en la consola de Firebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
