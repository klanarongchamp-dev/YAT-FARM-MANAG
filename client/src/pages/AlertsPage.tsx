import { useAuth } from "@/_core/hooks/useAuth";
import FarmDashboardLayout from "@/components/FarmDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertTriangle, Bell, BellOff, CheckCheck } from "lucide-react";
import { toast } from "sonner";

const ALERT_ICONS: Record<string, string> = {
  high_temp: "🌡️",
  low_soil: "🌾",
  low_humidity: "💧",
};

export default function AlertsPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: alerts, isLoading } = trpc.alerts.getAll.useQuery(
    { onlyUnread: false },
    { enabled: isAuthenticated, refetchInterval: 30000 }
  );

  const markRead = trpc.alerts.markRead.useMutation({
    onSuccess: () => utils.alerts.getAll.invalidate(),
  });

  const markAllRead = trpc.alerts.markAllRead.useMutation({
    onSuccess: () => {
      utils.alerts.getAll.invalidate();
      utils.alerts.getUnreadCount.invalidate();
      toast.success("ทำเครื่องหมายอ่านทั้งหมดแล้ว");
    },
  });

  const unreadCount = alerts?.filter((a) => !a.isRead).length ?? 0;

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
            <p className="text-muted-foreground text-sm mt-1">แจ้งเตือนเมื่อค่า Sensor ผิดปกติ</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              อ่านทั้งหมด ({unreadCount})
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              รายการแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !alerts?.length ? (
              <div className="text-center py-12">
                <BellOff className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      alert.isRead ? "opacity-60 bg-muted/20" : "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <span className="text-2xl shrink-0">{ALERT_ICONS[alert.type] ?? "⚠️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{alert.message}</p>
                        {!alert.isRead && (
                          <Badge variant="destructive" className="shrink-0 text-xs">ใหม่</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(alert.triggeredAt), "dd/MM/yy HH:mm:ss")}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 text-xs"
                        onClick={() => markRead.mutate({ id: alert.id })}
                      >
                        <Bell className="w-3 h-3 mr-1" />
                        อ่านแล้ว
                      </Button>
                    )}
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
