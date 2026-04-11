import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const [form, setForm] = useState({ newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.newPassword === user?.username) {
      setError("New password cannot be the same as your username");
      return;
    }

    setLoading(true);
    try {
      await changePassword(form.newPassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Icon + heading */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <KeyRound className="w-7 h-7 text-amber-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Change Your Password</h1>
          <p className="text-sm text-muted-foreground">
            Welcome, <span className="font-medium text-foreground">{user?.username}</span>.
            You must set a new password before continuing.
          </p>
        </div>

        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Set New Password</CardTitle>
            <CardDescription>
              Your default password was your username. Choose a secure password to proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Requirements hint */}
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 rounded-md px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.newPassword.length >= 6 ? "text-primary" : "text-muted-foreground/40"}`} />
                  At least 6 characters
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.newPassword && form.newPassword !== user?.username ? "text-primary" : "text-muted-foreground/40"}`} />
                  Not the same as your username
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${form.newPassword && form.confirm && form.newPassword === form.confirm ? "text-primary" : "text-muted-foreground/40"}`} />
                  Passwords match
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    data-testid="input-new-password"
                    type={showPw ? "text" : "password"}
                    value={form.newPassword}
                    onChange={set("newPassword")}
                    placeholder="At least 6 characters"
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  data-testid="input-confirm-password"
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  placeholder="Repeat new password"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                data-testid="button-change-password"
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Saving…" : "Set New Password"}
              </Button>

              <button
                type="button"
                onClick={logout}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                Sign out and log in as a different user
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
