import { useAuth } from "@/_core/hooks/useAuth";
import FarmDashboardLayout from "@/components/FarmDashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Clock, Plus, Trash2, Waves, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_DEVICE = "esp8266-001";

export default function PumpControlPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: devices, isLoading: devicesLoading } = trpc.device.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });
  const { data: schedules, isLoading: schedulesLoading } = trpc.schedule.getByDevice.useQuery(
    { deviceId: DEFAULT_DEVICE },
    { enabled: isAuthenticated }
  );

  const setPump = trpc.device.setPumpStatus.useMutation({
    onSuccess: () => {
      utils.device.getAll.invalidate();
      toast.success("สั่งงานปั๊มน้ำสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const setMode = trpc.device.setMode.useMutation({
    onSuccess: () => {
      utils.device.getAll.invalidate();
      toast.success("เปลี่ยนโหมดสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      utils.schedule.getByDevice.invalidate();
      toast.success("เพิ่มตารางเวลาสำเร็จ");
      setShowAddSchedule(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSchedule = trpc.schedule.update.useMutation({
    onSuccess: () => {
      utils.schedule.getByDevice.invalidate();
      toast.success("อัปเดตตารางเวลาสำเร็จ");
    },
  });

  const deleteSchedule = trpc.schedule.delete.useMutation({
    onSuccess: () => {
      utils.schedule.getByDevice.invalidate();
      toast.success("ลบตารางเวลาสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [newTime, setNewTime] = useState("06:00");
  const [newDuration, setNewDuration] = useState(10);
  const [newLabel, setNewLabel] = useState("");

  const mainDevice = devices?.[0];
  const isOn = mainDevice?.pumpStatus === "on";
  const isAuto = mainDevice?.mode === "auto";

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ควบคุมปั๊มน้ำ</h1>
          <p className="text-muted-foreground text-sm mt-1">จัดการการรดน้ำและตารางเวลาอัตโนมัติ</p>
        </div>

        {/* Pump Control Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Waves className="w-5 h-5 text-primary" />
              สถานะปั๊มน้ำ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="font-semibold">ปั๊มน้ำ</p>
                <p className="text-sm text-muted-foreground">
                  {mainDevice?.name ?? DEFAULT_DEVICE}
                </p>
              </div>
              <Badge
                variant={isOn ? "destructive" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {isOn ? "⚡ เปิดอยู่" : "○ ปิดอยู่"}
              </Badge>
            </div>

            {/* Toggle Pump */}
            <Button
              className="w-full h-14 text-base font-bold gap-2"
              variant={isOn ? "destructive" : "default"}
              disabled={setPump.isPending || devicesLoading || isAuto}
              onClick={() =>
                setPump.mutate({
                  deviceId: mainDevice?.deviceId ?? DEFAULT_DEVICE,
                  pumpStatus: isOn ? "off" : "on",
                })
              }
            >
              <Waves className="w-5 h-5" />
              {isOn ? "ปิดปั๊มน้ำ" : "เปิดปั๊มน้ำ"}
              {isAuto && <span className="text-xs opacity-70">(โหมด Auto)</span>}
            </Button>

            {/* Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">โหมดอัตโนมัติ</p>
                  <p className="text-xs text-muted-foreground">
                    {isAuto ? "ระบบควบคุมตามตารางเวลา" : "ควบคุมด้วยตนเอง"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isAuto}
                disabled={setMode.isPending}
                onCheckedChange={(checked) =>
                  setMode.mutate({
                    deviceId: mainDevice?.deviceId ?? DEFAULT_DEVICE,
                    mode: checked ? "auto" : "manual",
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedules */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                ตารางรดน้ำ
              </CardTitle>
              <Button size="sm" onClick={() => setShowAddSchedule(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                เพิ่ม
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <p className="text-muted-foreground text-sm text-center py-4">กำลังโหลด...</p>
            ) : !schedules?.length ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                ยังไม่มีตารางเวลา กดปุ่ม "เพิ่ม" เพื่อสร้างตารางรดน้ำ
              </p>
            ) : (
              <div className="space-y-3">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-primary w-16">{s.time}</div>
                      <div>
                        <p className="font-medium text-sm">{s.label || "รดน้ำ"}</p>
                        <p className="text-xs text-muted-foreground">{s.duration} นาที</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(checked) =>
                          updateSchedule.mutate({ id: s.id, enabled: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() => deleteSchedule.mutate({ id: s.id })}
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

      {/* Add Schedule Dialog */}
      <Dialog open={showAddSchedule} onOpenChange={setShowAddSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มตารางรดน้ำ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>เวลา (HH:MM)</Label>
              <Input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>ระยะเวลา (นาที)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อ (ไม่บังคับ)</Label>
              <Input
                placeholder="เช่น รดน้ำเช้า"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSchedule(false)}>
              ยกเลิก
            </Button>
            <Button
              disabled={createSchedule.isPending}
              onClick={() =>
                createSchedule.mutate({
                  deviceId: DEFAULT_DEVICE,
                  time: newTime,
                  duration: newDuration,
                  label: newLabel || undefined,
                })
              }
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FarmDashboardLayout>
  );
}
