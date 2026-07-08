import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import FarmDashboardLayout from "@/components/FarmDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Thermometer, Droplets, Leaf, Sun, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const DEFAULT_DEVICE = "esp8266-001";

function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value?: number | null;
  unit: string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <div className={`p-2 rounded-xl ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="text-3xl font-bold text-foreground">
            {value != null ? `${value.toFixed(1)}${unit}` : <span className="text-muted-foreground text-xl">--{unit}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [historyHours, setHistoryHours] = useState(24);

  const { data: latest, isLoading: latestLoading, refetch } = trpc.sensor.getLatest.useQuery(
    { deviceId: DEFAULT_DEVICE },
    { refetchInterval: 15000 }
  );

  const { data: history, isLoading: historyLoading } = trpc.sensor.getHistory.useQuery(
    { deviceId: DEFAULT_DEVICE, hours: historyHours },
    { enabled: isAuthenticated, refetchInterval: 60000 }
  );

  const { data: devices } = trpc.device.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  if (authLoading) return null;
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-sm p-8 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-2xl font-bold mb-2">YAT FARM MANAGER</h1>
          <p className="text-muted-foreground mb-6 text-sm">ระบบจัดการฟาร์มอัจฉริยะ</p>
          <Button className="w-full" onClick={() => startLogin()}>
            เข้าสู่ระบบ
          </Button>
        </Card>
      </div>
    );
  }

  const chartData =
    history?.map((r) => ({
      time: format(new Date(r.recordedAt), "HH:mm"),
      อุณหภูมิ: r.temperature,
      ความชื้น: r.humidity,
      ความชื้นดิน: r.soilMoisture,
      แสง: r.light,
    })) ?? [];

  const mainDevice = devices?.[0];

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">ติดตามสภาพแวดล้อมฟาร์มแบบ Real-time</p>
          </div>
          <div className="flex items-center gap-3">
            {mainDevice ? (
              <Badge variant={mainDevice.status === "online" ? "default" : "secondary"} className="gap-1.5">
                {mainDevice.status === "online" ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {mainDevice.status === "online" ? "ออนไลน์" : "ออฟไลน์"}
              </Badge>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Sensor Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SensorCard
            icon={Thermometer}
            label="อุณหภูมิ"
            value={latest?.temperature}
            unit="°C"
            color="bg-orange-500"
            loading={latestLoading}
          />
          <SensorCard
            icon={Droplets}
            label="ความชื้นอากาศ"
            value={latest?.humidity}
            unit="%"
            color="bg-blue-500"
            loading={latestLoading}
          />
          <SensorCard
            icon={Leaf}
            label="ความชื้นดิน"
            value={latest?.soilMoisture}
            unit="%"
            color="bg-primary"
            loading={latestLoading}
          />
          <SensorCard
            icon={Sun}
            label="แสง"
            value={latest?.light}
            unit=" lux"
            color="bg-yellow-500"
            loading={latestLoading}
          />
        </div>

        {/* Device Status */}
        {mainDevice && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">สถานะอุปกรณ์</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">อุปกรณ์</p>
                  <p className="font-semibold">{mainDevice.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ปั๊มน้ำ</p>
                  <Badge variant={mainDevice.pumpStatus === "on" ? "destructive" : "secondary"}>
                    {mainDevice.pumpStatus === "on" ? "เปิดอยู่" : "ปิดอยู่"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">โหมด</p>
                  <Badge variant="outline">{mainDevice.mode === "auto" ? "อัตโนมัติ" : "ควบคุมเอง"}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">พบล่าสุด</p>
                  <p className="font-semibold text-xs">
                    {mainDevice.lastSeen ? format(new Date(mainDevice.lastSeen), "dd/MM HH:mm") : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">กราฟประวัติข้อมูล</CardTitle>
              <div className="flex gap-2">
                {[6, 12, 24, 48].map((h) => (
                  <Button
                    key={h}
                    variant={historyHours === h ? "default" : "outline"}
                    size="sm"
                    onClick={() => setHistoryHours(h)}
                    className="text-xs h-7 px-2"
                  >
                    {h}ชม.
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                ยังไม่มีข้อมูลประวัติ
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="อุณหภูมิ" stroke="#f97316" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ความชื้น" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ความชื้นดิน" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="แสง" stroke="#eab308" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </FarmDashboardLayout>
  );
}
