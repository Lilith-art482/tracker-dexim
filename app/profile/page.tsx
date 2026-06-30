"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { User, LogOut, Loader2, Save, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

interface UserProfile {
  uid: string;
  email: string | null;
  nickname: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/auth/login");
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        nickname: firebaseUser.displayName,
      });
      setNickname(firebaseUser.displayName || "");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSave = async () => {
    if (!user || !nickname.trim()) return;

    setSaving(true);
    try {
      // Обновление в Firebase Auth
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: nickname.trim(),
        });
      }

      // Обновление в Firestore через API
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          nickname: nickname.trim(),
        }),
      });

      setUser({ ...user, nickname: nickname.trim() });
      toast.success("Профиль обновлён!");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Ошибка обновления профиля");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Выход выполнен");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Ошибка выхода");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Градиент по углам */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-primary/15 to-transparent rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>На главную</span>
          </Link>
        </div>

        {/* Профиль карточка */}
        <div className="max-w-2xl mx-auto">
          <div className="backdrop-blur-xl bg-card/50 border border-border rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {user?.nickname || "Пользователь"}
              </h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Редактирование никнейма */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/90" htmlFor="nickname">
                  Никнейм
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
                      placeholder="Ваш никнейм"
                      minLength={2}
                      maxLength={30}
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !nickname.trim()}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Сохранить</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Разделитель */}
              <div className="border-t border-border pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 px-4 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Выйти</span>
                </button>
              </div>
            </div>
          </div>

          {/* Инфо */}
          <div className="mt-6 text-center text-muted-foreground/50 text-sm">
            <p>ID: {user?.uid}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

