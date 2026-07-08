import { useAuth } from "@/_core/hooks/useAuth";
import FarmDashboardLayout from "@/components/FarmDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Activity } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  pump_control: "ควบคุมปั๊มน้ำ",
  mode_change: "เปลี่ยนโหมด",
  schedule_create: "เพิ่มตารางเวลา",
  schedule_delete: "ลบตารางเวลา",
  finance_create: "บันทึกการเงิน",
  finance_delete: "ลบรายการเงิน",
  yield_create: "บันทึกผลผลิต",
  yield_delete: "ลบผลผลิต",
  user_role_change: "เปลี่ยน Role ผู้ใช้",
  user_delete: "ลบผู้ใช้",
};

export default function ActivityLogPage() {
  const { isAuthenticated } = useAuth();
  const { data: logs, isLoading } = trpc.activityLog.getAll.useQuery(
    { limit: 200 },
    { enabled: isAuthenticated }
  );

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground text-sm mt-1">ประวัติการสั่งงานและเหตุการณ์สำคัญในระบบ</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              บันทึกกิจกรรม ({logs?.length ?? 0} รายการ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : !logs?.length ? (
              <p className="text-muted-foreground text-sm text-center py-10">ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(new Date(log.createdAt), "dd/MM/yy HH:mm")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.detail}</p>
                      <p className="text-xs text-primary/70 mt-0.5">โดย: {log.userName ?? "ระบบ"}</p>
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
