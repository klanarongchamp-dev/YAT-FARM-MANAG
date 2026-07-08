import { useAuth } from "@/_core/hooks/useAuth";
import FarmDashboardLayout from "@/components/FarmDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export default function UserManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: users, isLoading } = trpc.adminUsers.getAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateRole = trpc.adminUsers.updateRole.useMutation({
    onSuccess: () => {
      utils.adminUsers.getAll.invalidate();
      toast.success("เปลี่ยน Role สำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteUser = trpc.adminUsers.deleteUser.useMutation({
    onSuccess: () => {
      utils.adminUsers.getAll.invalidate();
      toast.success("ลบผู้ใช้สำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <FarmDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">เฉพาะผู้ดูแลระบบเท่านั้น</p>
          </div>
        </div>
      </FarmDashboardLayout>
    );
  }

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground text-sm mt-1">เพิ่ม ลบ และเปลี่ยน Role ผู้ใช้งาน</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-primary" />
              ผู้ใช้งานทั้งหมด ({users?.length ?? 0} คน)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !users?.length ? (
              <p className="text-muted-foreground text-sm text-center py-8">ไม่มีผู้ใช้งาน</p>
            ) : (
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">
                          {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{u.name ?? "ไม่มีชื่อ"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email ?? u.openId}</p>
                        <p className="text-xs text-muted-foreground">
                          เข้าร่วม {format(new Date(u.createdAt), "dd/MM/yy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={u.role}
                        onValueChange={(role) =>
                          updateRole.mutate({ userId: u.id, role: role as "admin" | "user" })
                        }
                        disabled={u.id === user?.id}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        disabled={u.id === user?.id}
                        onClick={() => {
                          if (confirm(`ยืนยันการลบผู้ใช้ ${u.name ?? u.email}?`)) {
                            deleteUser.mutate({ userId: u.id });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FarmDashboardLayout>
  );
}

