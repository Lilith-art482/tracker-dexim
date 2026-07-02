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
        router.push("/auth");
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
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: nickname.trim(),
        });
      }

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
      router.push("/auth");
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
      {/* Градиенты по углам */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-l from-primary/15 to-transparent rounded-full blur-3xl" />

      {/* Зернистость */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

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
          <div className="backdrop-blur-xl bg-card/60 border border-border/60 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-xl">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
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
                <label
                  className="text-sm font-medium text-foreground/90"
                  htmlFor="nickname"
                >
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
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold rounded-xl hover:from-primary/90 hover:to-primary/70 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
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
