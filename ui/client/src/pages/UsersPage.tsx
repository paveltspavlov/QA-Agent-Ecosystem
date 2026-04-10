import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Users, UserPlus, Pencil, Trash2, ShieldCheck, Eye, User, ToggleLeft, ToggleRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SafeUser } from "@shared/schema";

const ROLE_META: Record<string, { label: string; color: string; icon: typeof ShieldCheck }> = {
  admin:    { label: "Admin",    color: "text-red-400 bg-red-400/10 border-red-400/30",    icon: ShieldCheck },
  operator: { label: "Operator", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: User },
  viewer:   { label: "Viewer",   color: "text-slate-400 bg-slate-400/10 border-slate-400/30",  icon: Eye },
};

function RoleBadge({ role }: { role: string }) {
  const m = ROLE_META[role] ?? ROLE_META.viewer;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${m.color}`}>
      <m.icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

// ── Create User Dialog ──────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/users", form);
      if (!res.ok) {
        const { error: err } = await res.json();
        throw new Error(err);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created", description: `${form.username} has been added.` });
      setForm({ username: "", email: "", password: "", role: "viewer" });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input data-testid="input-new-username" value={form.username} onChange={set("username")} required />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input data-testid="input-new-email" type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input data-testid="input-new-password" type="password" value={form.password} onChange={set("password")} placeholder="Min. 8 characters" required />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                <SelectItem value="operator">Operator — run agents &amp; workflows</SelectItem>
                <SelectItem value="admin">Admin — full access + user management</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create User"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit User Dialog ────────────────────────────────────────────────────────

function EditUserDialog({ user, currentUserId, onClose }: {
  user: SafeUser; currentUserId: number; onClose: () => void;
}) {
  const [form, setForm] = useState({
    email: user.email,
    role: user.role,
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const isSelf = user.id === currentUserId;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload: any = { email: form.email, role: form.role };
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User — {user.username}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
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
            <Label>New Password <span className="text-muted-foreground">(leave blank to keep current)</span></Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Optional" />
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

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
      <div className="p-6 text-center text-muted-foreground">
        Admin access required to manage users.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> User Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create and manage access for team members
          </p>
        </div>
        <Button data-testid="button-add-user" onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-red-400" /> <strong>Admin</strong> — full access, user management</span>
        <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-amber-400" /> <strong>Operator</strong> — run agents &amp; workflows, view reports</span>
        <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-slate-400" /> <strong>Viewer</strong> — read-only: reports &amp; run history</span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {users.length} {users.length === 1 ? "User" : "Users"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading…</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">No users found.</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <div
                    key={u.id}
                    data-testid={`row-user-${u.id}`}
                    className={`flex items-center gap-4 px-6 py-4 ${!u.isActive ? "opacity-50" : ""}`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
                      {u.username[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{u.username}</span>
                        {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                        {!u.isActive && <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">Inactive</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Last login: {u.lastLoginAt
                          ? formatDistanceToNow(new Date(u.lastLoginAt), { addSuffix: true })
                          : "never"}
                      </div>
                    </div>

                    {/* Role badge */}
                    <RoleBadge role={u.role} />

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
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
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        title="Edit"
                        onClick={() => setEditUser(u)}
                        data-testid={`button-edit-${u.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 hover:text-destructive"
                        title="Delete"
                        disabled={isSelf}
                        onClick={() => {
                          if (confirm(`Delete user "${u.username}"? This cannot be undone.`)) {
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
        </CardContent>
      </Card>

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
