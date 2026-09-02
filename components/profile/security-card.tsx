"use client";

import { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { isWebAuthnSupported, registerBiometric } from "@/lib/biometric-client";
import {
  Fingerprint,
  ShieldCheck,
  Smartphone,
  KeyRound,
  LogIn,
  Mail,
  Lock,
  Copy,
  Check,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TotpState = {
  enabled: boolean;
  settings: {
    requireOnLogin: boolean;
    requireOnEmailChange: boolean;
    requireOnPasswordChange: boolean;
    requireForBiometric: boolean;
  } | null;
};

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function SecurityCard({ uid }: { uid: string }) {
  // Biometric
  const [biometricDevices, setBiometricDevices] = useState<
    Array<{ id: string; deviceName: string; createdAt: string | null; lastUsedAt: string | null }>
  >([]);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);

  // TOTP
  const [totp, setTotp] = useState<TotpState>({ enabled: false, settings: null });
  const [totpLoading, setTotpLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ secret: string; qrDataUrl: string; uri: string } | null>(null);
  const [setupToken, setSetupToken] = useState("");
  const [setupBusy, setSetupBusy] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [disableToken, setDisableToken] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [showGaVerifyDialog, setShowGaVerifyDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, []);

  const fetchTotpStatus = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !uid) return;
      const res = await fetch(`/api/auth/totp?uid=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTotp({ enabled: data.enabled, settings: data.settings });
      }
    } catch {}
    setTotpLoading(false);
  }, [uid, getToken]);

  const fetchBiometrics = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token || !uid) return;
      const res = await fetch(`/api/auth/biometric?uid=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBiometricDevices(data.devices || []);
      }
    } catch {}
  }, [uid, getToken]);

  useEffect(() => {
    isWebAuthnSupported().then(setBiometricSupported);
    fetchTotpStatus();
    fetchBiometrics();
  }, [fetchTotpStatus, fetchBiometrics]);

  const handleAddBiometric = async () => {
    if (totp.enabled && totp.settings?.requireForBiometric) {
      setShowGaVerifyDialog(true);
      setPendingAction(() => doAddBiometric);
      return;
    }
    await doAddBiometric();
  };

  const doAddBiometric = async () => {
    setBiometricBusy(true);
    try {
      await registerBiometric(uid);
      toast.success("Биометрия привязана");
      await fetchBiometrics();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка";
      toast.error(msg);
    } finally {
      setBiometricBusy(false);
    }
  };

  const handleRemoveBiometric = async (credentialId: string) => {
    const doRemove = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/auth/biometric", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ uid, credentialId }),
        });
        if (!res.ok) throw new Error("Ошибка");
        toast.success("Биометрия отвязана");
        await fetchBiometrics();
      } catch {
        toast.error("Ошибка удаления");
      }
    };
    if (totp.enabled && totp.settings?.requireForBiometric) {
      setShowGaVerifyDialog(true);
      setPendingAction(() => () => doRemove());
      return;
    }
    await doRemove();
  };

  const handleTotpSetup = async () => {
    setSetupBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setSetupData(data);
      setSetupToken("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSetupBusy(false);
    }
  };

  const handleTotpVerify = async () => {
    if (setupToken.length !== 6) return;
    setSetupBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, token: setupToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверный код");
      toast.success("Google Authenticator подключён");
      setSetupData(null);
      setSetupToken("");
      await fetchTotpStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSetupBusy(false);
    }
  };

  const handleTotpDisable = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, token: disableToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success("GA отключён");
      setShowDisableDialog(false);
      setDisableToken("");
      await fetchTotpStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleTotpSettingChange = async (key: "requireOnLogin" | "requireOnEmailChange" | "requireOnPasswordChange" | "requireForBiometric", value: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/totp/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, settings: { [key]: value } }),
      });
      if (!res.ok) throw new Error("Ошибка");
      const data = await res.json();
      setTotp((prev) => ({ ...prev, settings: data.settings }));
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleGaVerify = async () => {
    if (verifyToken.length !== 6) return;
    setVerifyBusy(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/auth/totp/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, token: verifyToken }),
      });
      if (!res.ok) throw new Error("Неверный код");
      setShowGaVerifyDialog(false);
      setVerifyToken("");
      const action = pendingAction;
      setPendingAction(null);
      if (action) await action();
    } catch {
      toast.error("Неверный код");
    } finally {
      setVerifyBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Безопасность</p>
              <p className="text-xs text-muted-foreground/70">Защита аккаунта и вход</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {/* Biometric section */}
          <div className="rounded-xl border bg-muted/10 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Fingerprint className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">
                    {biometricDevices.length > 0 ? "Биометрия подключена" : "Биометрия"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {biometricDevices.length > 0
                      ? `Устройств: ${biometricDevices.length}`
                      : "Отпечаток или Face ID"}
                  </p>
                </div>
              </div>
              {biometricSupported &&
                (biometricDevices.length > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Check className="h-3 w-3" /> Привязано
                  </span>
                ) : (
                  <Button size="sm" onClick={handleAddBiometric} disabled={biometricBusy} className="gap-1.5 h-7 text-xs">
                    {biometricBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Fingerprint className="h-3.5 w-3.5" />}
                    Привязать
                  </Button>
                ))}
            </div>
            {biometricDevices.length > 0 && (
              <div className="mt-3 space-y-2">
                {biometricDevices.map((device) => (
                  <div key={device.id} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                    <Fingerprint className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{device.deviceName}</p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {device.lastUsedAt
                          ? `Использовано ${new Date(device.lastUsedAt).toLocaleDateString("ru-RU")}`
                          : "Не использовалось"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                      onClick={() => handleRemoveBiometric(device.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GA section */}
          <div className="rounded-xl border bg-muted/10 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium">Google Authenticator</p>
                  <p className="text-[11px] text-muted-foreground/70">
                    {totpLoading ? "Загрузка..." : totp.enabled ? "Включён" : "Двухфакторная защита"}
                  </p>
                </div>
              </div>
              {!totpLoading &&
                (totp.enabled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setShowDisableDialog(true)}
                  >
                    Отключить
                  </Button>
                ) : setupData ? (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSetupData(null)}>
                    Отмена
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleTotpSetup} disabled={setupBusy}>
                    {setupBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                    Подключить
                  </Button>
                ))}
            </div>

            {/* Setup QR */}
            {setupData && !totp.enabled && (
              <div className="mt-3 space-y-3 rounded-lg border bg-background p-3">
                <p className="text-xs text-muted-foreground text-center">
                  Отсканируйте QR в Google Authenticator
                </p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={setupData.qrDataUrl} alt="QR" className="h-48 w-48 rounded-lg border bg-white p-1" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">Или введите ключ вручную</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono break-all">
                      {showSecret ? setupData.secret : "••••••••••••••••"}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(setupData.secret);
                        toast.success("Скопировано");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Код из приложения</Label>
                  <div className="flex gap-2">
                    <Input
                      value={setupToken}
                      onChange={(e) => setSetupToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="h-8 font-mono text-center tracking-widest"
                    />
                    <Button size="sm" className="h-8" onClick={handleTotpVerify} disabled={setupToken.length !== 6 || setupBusy}>
                      {setupBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Подтвердить"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Protection toggles when GA enabled */}
            {totp.enabled && totp.settings && (
              <div className="mt-3 space-y-2 rounded-lg border bg-background p-3">
                <p className="text-xs font-medium">Защита</p>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="flex items-center gap-2 text-xs">
                      <LogIn className="h-3.5 w-3.5 text-muted-foreground/60" /> Запрашивать при входе
                    </span>
                    <Toggle
                      checked={totp.settings.requireOnLogin}
                      onChange={(v) => handleTotpSettingChange("requireOnLogin", v)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="flex items-center gap-2 text-xs">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground/60" /> При смене почты
                    </span>
                    <Toggle
                      checked={totp.settings.requireOnEmailChange}
                      onChange={(v) => handleTotpSettingChange("requireOnEmailChange", v)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="flex items-center gap-2 text-xs">
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/60" /> При смене пароля
                    </span>
                    <Toggle
                      checked={totp.settings.requireOnPasswordChange}
                      onChange={(v) => handleTotpSettingChange("requireOnPasswordChange", v)}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="flex items-center gap-2 text-xs">
                      <Fingerprint className="h-3.5 w-3.5 text-muted-foreground/60" /> Для биометрии
                    </span>
                    <Toggle
                      checked={totp.settings.requireForBiometric}
                      onChange={(v) => handleTotpSettingChange("requireForBiometric", v)}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disable GA dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Отключить GA?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Введите код из приложения для подтверждения.</p>
          <Input
            value={disableToken}
            onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="h-8 font-mono text-center tracking-widest"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowDisableDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" size="sm" onClick={handleTotpDisable}>
              Отключить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GA verify for biometric */}
      <Dialog open={showGaVerifyDialog} onOpenChange={setShowGaVerifyDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Подтвердите GA</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Введите код из Google Authenticator.</p>
          <Input
            value={verifyToken}
            onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="h-8 font-mono text-center tracking-widest"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowGaVerifyDialog(false)}>
              Отмена
            </Button>
            <Button size="sm" onClick={handleGaVerify} disabled={verifyToken.length !== 6 || verifyBusy}>
              {verifyBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Подтвердить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
