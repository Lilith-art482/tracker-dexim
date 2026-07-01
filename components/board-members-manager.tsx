"use client";

import { useState } from "react";
import { Users, Plus, X, Loader2, User } from "lucide-react";
import type { BoardMember } from "@/lib/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface BoardMembersManagerProps {
  boardId: string;
  initialMembers: BoardMember[];
}
export function BoardMembersManager({ boardId, initialMembers }: BoardMembersManagerProps) {
  const [members, setMembers] = useState<BoardMember[]>(initialMembers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [users, setUsers] = useState<{ uid: string; nickname?: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch {
      // ignore
    }
  };

  const onOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) fetchUsers();
  };

  const handleAdd = async () => {
    const name = newMemberName.trim();
    if (!name && !selectedUser) return;

    setAdding(true);
    try {
      const payload: { boardId: string; userId?: string; name?: string } = { boardId };
      if (selectedUser) payload.userId = selectedUser;
      else payload.name = name;

      const res = await fetch("/api/board-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка добавления участника");
        return;
      }

      const member: BoardMember = await res.json();
      setMembers((prev) => [...prev, member]);
      setNewMemberName("");
      setSelectedUser(null);
      toast.success("Участник добавлен");
    } catch {
      toast.error("Ошибка добавления участника");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/board-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Ошибка удаления участника");
        return;
      }

      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast.success("Участник удалён");
    } catch {
      toast.error("Ошибка удаления участника");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            Участники ({members.length})
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Участники доски</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <select
              value={selectedUser || ""}
              onChange={(e) => setSelectedUser(e.target.value || null)}
              className="rounded-lg border px-3 py-2 bg-muted/10 text-sm w-44"
            >
              <option value="">— Выбрать зарегистрированного —</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.nickname || u.uid}
                </option>
              ))}
            </select>

            <Input
              placeholder="Имя участника (вручную)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <Button
              onClick={handleAdd}
              disabled={adding || (!newMemberName.trim() && !selectedUser)}
              size="sm"
              className="gap-1 shrink-0"
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Добавить
            </Button>
          </div>

          <div className="flex flex-col gap-1">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                На доске пока нет участников
              </p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{member.name || member.userId}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(member.id)}
                    disabled={deletingId === member.id}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {deletingId === member.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
