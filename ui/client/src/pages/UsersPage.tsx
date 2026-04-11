import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, UserPlus, Pencil, Trash2, ShieldCheck, Eye, User,
  ToggleLeft, ToggleRight, KeyRound,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SafeUser } from "@shared/schema";

// ── Role badge ──────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  admin:    { label: "Admin",    color: "text-red-400 bg-red-400/10 border-red-400/30",       icon: ShieldCheck },
  operator: { label: "Operator", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: User },
  viewer:   { label: "Viewer",   color: "text-slate-400 bg-slate-400/10 border-slate-400/30", icon: Eye },
};

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.viewer;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${m.color}`}>
      <m.icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

// ── Create dialog ───────────────────────────────────────────────────────────
function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ username: "", password: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const reset = () => setForm({ username: "", password: "", role: "viewer" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/users", {
        username: form.username,
        password: form.password || undefined, // if blank → defaults to username on server
        role: form.role,
      });
      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User created",
        description: `"${form.username}" added. They will be asked to set a new password on first login.`,
      });
      reset();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input
              data-testid="input-new-username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="e.g. jsmith"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Initial Password
              <span className="text-muted-foreground font-normal ml-1">(leave blank to use username)</span>
            </Label>
            <Input
              data-testid="input-new-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Default: same as username"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer — read-only</SelectItem>
                <SelectItem value="operator">Operator — run agents &amp; workflows</SelectItem>
                <SelectItem value="admin">Admin — full access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
            The user will be prompted to set a new password on their first login.
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit dialog ─────────────────────────────────────────────────────────────
function EditUserDialog({ user, currentUserId, onClose }: {
  user: SafeUser; currentUserId: number; onClose: () => void;
}) {
  const [form, setForm] = useState({ role: user.role, password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isSelf = user.id === currentUserId;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload: any = { role: form.role };
    if (form.password) payload.password = form.password;
    try {
      const res = await apiRequest("PATCH", `/api/users/${user.id}`, payload);
      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated" });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edit — {user.username}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && <p className="text-xs text-muted-foreground">Cannot change your own role.</p>}
          </div>

          <div className="space-y-1.5">
            <Label>
              Reset Password
              <span className="text-muted-foreground font-normal ml-1">(leave blank to keep current)</span>
            </Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="New password (min. 6 chars)"
            />
            {form.password && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> User will be prompted to change password on next login.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<SafeUser | null>(null);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    queryFn: () => apiRequest("GET", "/api/users").then((r) => r.json()),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/users/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/users"] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted" });
    },
  });

  if (currentUser?.role !== "admin") {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Users
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} {users.length === 1 ? "account" : "accounts"} — new users must set a password on first login
          </p>
        </div>
        <Button data-testid="button-add-user" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* User list */}
      <div className="rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No users yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  data-testid={`row-user-${u.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-accent/30 transition-colors ${!u.isActive ? "opacity-50" : ""}`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    {u.username[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{u.username}</span>
                      {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                      {u.mustChangePassword && (
                        <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 gap-1">
                          <KeyRound className="w-2.5 h-2.5" /> must change password
                        </Badge>
                      )}
                      {!u.isActive && (
                        <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Last login: {u.lastLoginAt
                        ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })
                        : "never"}
                    </div>
                  </div>

                  {/* Role */}
                  <RoleBadge role={u.role} />

                  {/* Actions */}
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost" size="icon" className="w-8 h-8"
                      title={u.isActive ? "Deactivate" : "Activate"}
                      disabled={isSelf}
                      onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                      data-testid={`button-toggle-${u.id}`}
                    >
                      {u.isActive
                        ? <ToggleRight className="w-4 h-4 text-primary" />
                        : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="w-8 h-8"
                      title="Edit"
                      onClick={() => setEditUser(u)}
                      data-testid={`button-edit-${u.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="w-8 h-8 hover:text-destructive"
                      title="Delete"
                      disabled={isSelf}
                      onClick={() => {
                        if (confirm(`Delete "${u.username}"? This cannot be undone.`)) {
                          deleteUser.mutate(u.id);
                        }
                      }}
                      data-testid={`button-delete-${u.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} />
      {editUser && (
        <EditUserDialog
          user={editUser}
          currentUserId={currentUser!.id}
          onClose={() => setEditUser(null)}
        />
      )}
    </div>
  );
}
