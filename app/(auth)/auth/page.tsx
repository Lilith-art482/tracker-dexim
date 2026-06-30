"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { Mail, Lock, User, Key, Loader2, Sparkles } from "lucide-react";
import "../auth-globals.css";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    accessCode: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success("Вход выполнен!");
        router.push("/");
      } else {
        if (formData.accessCode !== "demo-tracker-2026") {
          toast.error("Неверный код доступа");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await updateProfile(userCredential.user, {
          displayName: formData.nickname,
        });

        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        toast.success("Регистрация успешна!");
        router.push("/");
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error("Auth error:", err);
      
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        toast.error("Неверный email или пароль");
      } else if (err.code === "auth/email-already-in-use") {
        toast.error("Этот email уже зарегистрирован");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Некорректный email");
      } else if (err.code === "auth/weak-password") {
        toast.error("Пароль должен быть не менее 6 символов");
      } else {
        toast.error(err.message || "Ошибка. Попробуйте ещё раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Сетка на фоне */}
      <div 
        className="auth-grid"
        style={{
          backgroundImage: `
            linear-gradient(to right, #4E6E62 1px, transparent 1px),
            linear-gradient(to bottom, #4E6E62 1px, transparent 1px)
          `,
        }}
      />
      
      {/* Анимированные круги с зернистостью */}
      <div className="auth-circle auth-circle-1">
        <div className="auth-circle-bg" />
        <div className="auth-noise" />
      </div>
      
      <div className="auth-circle auth-circle-2">
        <div className="auth-circle-bg" />
        <div className="auth-noise" />
      </div>
      
      <div className="auth-circle auth-circle-3">
        <div className="auth-circle-bg" />
        <div className="auth-noise" />
      </div>
      
      <div className="auth-circle auth-circle-4">
        <div className="auth-circle-bg" />
        <div className="auth-noise" />
      </div>

      {/* Форма */}
      <div className="auth-container">
        <div className="auth-card">
          {/* Логотип */}
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>

          {/* Переключатель */}
          <div className="auth-tabs">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`auth-tab ${isLogin ? 'active' : ''}`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="nickname">
                  Никнейм
                </label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" />
                  <input
                    id="nickname"
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="auth-input"
                    placeholder="Ваше имя"
                    required
                    minLength={2}
                    maxLength={30}
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Email
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="auth-input"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">
                Пароль
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="auth-input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="accessCode">
                  Код доступа
                </label>
                <div className="auth-input-wrapper">
                  <Key className="auth-input-icon" />
                  <input
                    id="accessCode"
                    type="text"
                    value={formData.accessCode}
                    onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                    className="auth-input"
                    placeholder="demo-tracker-2026"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isLogin ? 'Входим...' : 'Регистрация...'}</span>
                </>
              ) : (
                isLogin ? 'Войти' : 'Зарегистрироваться'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
