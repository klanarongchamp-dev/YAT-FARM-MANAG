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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const INCOME_CATEGORIES = ["ขายผลผลิต", "ขายสัตว์", "เงินช่วยเหลือ", "อื่นๆ"];
const EXPENSE_CATEGORIES = [
  "ค่าปุ๋ย",
  "ค่ายา/สารเคมี",
  "ค่าแรง",
  "ค่าไฟฟ้า/น้ำ",
  "ค่าซ่อมบำรุง",
  "ค่าอาหารสัตว์",
  "ค่าขนส่ง",
  "อื่นๆ",
];

function formatCurrency(amount: string | number) {
  return Number(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FinancePage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  // Transactions
  const { data: transactions, isLoading: txLoading } = trpc.finance.getTransactions.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const createTx = trpc.finance.createTransaction.useMutation({
    onSuccess: () => {
      utils.finance.getTransactions.invalidate();
      toast.success("บันทึกรายการสำเร็จ");
      setShowTxDialog(false);
      resetTxForm();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteTx = trpc.finance.deleteTransaction.useMutation({
    onSuccess: () => {
      utils.finance.getTransactions.invalidate();
      toast.success("ลบรายการสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  // Yields
  const { data: yields, isLoading: yieldsLoading } = trpc.finance.getYields.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const createYield = trpc.finance.createYield.useMutation({
    onSuccess: () => {
      utils.finance.getYields.invalidate();
      toast.success("บันทึกผลผลิตสำเร็จ");
      setShowYieldDialog(false);
      resetYieldForm();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteYield = trpc.finance.deleteYield.useMutation({
    onSuccess: () => {
      utils.finance.getYields.invalidate();
      toast.success("ลบผลผลิตสำเร็จ");
    },
    onError: (e) => toast.error(e.message),
  });

  // Transaction form state
  const [showTxDialog, setShowTxDialog] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txCategory, setTxCategory] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txNote, setTxNote] = useState("");

  const resetTxForm = () => {
    setTxCategory("");
    setTxAmount("");
    setTxDate(format(new Date(), "yyyy-MM-dd"));
    setTxNote("");
  };

  // Yield form state
  const [showYieldDialog, setShowYieldDialog] = useState(false);
  const [yieldCrop, setYieldCrop] = useState("");
  const [yieldKg, setYieldKg] = useState("");
  const [yieldGrade, setYieldGrade] = useState<"A" | "B">("A");
  const [yieldPrice, setYieldPrice] = useState("");
  const [yieldDate, setYieldDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [yieldNote, setYieldNote] = useState("");

  const resetYieldForm = () => {
    setYieldCrop("");
    setYieldKg("");
    setYieldGrade("A");
    setYieldPrice("");
    setYieldDate(format(new Date(), "yyyy-MM-dd"));
    setYieldNote("");
  };

  // Summary calculations
  const totalIncome = transactions
    ?.filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const totalExpense = transactions
    ?.filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0) ?? 0;
  const netProfit = totalIncome - totalExpense;

  const gradeATotal = yields
    ?.filter((y) => y.grade === "A")
    .reduce((s, y) => s + Number(y.totalValue), 0) ?? 0;
  const gradeBTotal = yields
    ?.filter((y) => y.grade === "B")
    .reduce((s, y) => s + Number(y.totalValue), 0) ?? 0;

  return (
    <FarmDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">การเงินฟาร์ม</h1>
          <p className="text-muted-foreground text-sm mt-1">บันทึกรายรับ รายจ่าย และผลผลิต</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">รายรับรวม</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-600">฿{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">รายจ่ายรวม</span>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-600">฿{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">กำไรสุทธิ</span>
                <Package className="w-4 h-4 text-primary" />
              </div>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                ฿{formatCurrency(netProfit)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="transactions">รายรับ/รายจ่าย</TabsTrigger>
            <TabsTrigger value="yields">ผลผลิต</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">รายการทั้งหมด</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetTxForm();
                      setShowTxDialog(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มรายการ
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {txLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !transactions?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-10">
                    ยังไม่มีรายการ กดปุ่ม "เพิ่มรายการ" เพื่อบันทึก
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {tx.type === "income" ? (
                            <ArrowUpCircle className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-red-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{tx.category}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.date} {tx.note ? `· ${tx.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-bold text-sm ${
                              tx.type === "income" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"}฿{formatCurrency(tx.amount)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => {
                              if (confirm("ยืนยันการลบรายการนี้?")) {
                                deleteTx.mutate({ id: tx.id });
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
          </TabsContent>

          {/* Yields Tab */}
          <TabsContent value="yields" className="mt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-yellow-500 text-white">Grade A</Badge>
                  </div>
                  <p className="text-xl font-bold text-yellow-600">฿{formatCurrency(gradeATotal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">Grade B</Badge>
                  </div>
                  <p className="text-xl font-bold text-muted-foreground">฿{formatCurrency(gradeBTotal)}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-primary" />
                    บันทึกผลผลิต
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      resetYieldForm();
                      setShowYieldDialog(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มผลผลิต
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {yieldsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : !yields?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-10">
                    ยังไม่มีข้อมูลผลผลิต
                  </p>
                ) : (
                  <div className="space-y-2">
                    {yields.map((y) => (
                      <div
                        key={y.id}
                        className="flex items-center justify-between p-3 rounded-xl border bg-card"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge
                            className={
                              y.grade === "A"
                                ? "bg-yellow-500 text-white shrink-0"
                                : "bg-muted text-muted-foreground shrink-0"
                            }
                          >
                            Grade {y.grade}
                          </Badge>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{y.cropName}</p>
                            <p className="text-xs text-muted-foreground">
                              {y.kg} kg · ฿{formatCurrency(y.pricePerKg)}/kg · {y.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-sm text-primary">
                            ฿{formatCurrency(y.totalValue)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive h-8 w-8"
                            onClick={() => {
                              if (confirm("ยืนยันการลบผลผลิตนี้?")) {
                                deleteYield.mutate({ id: y.id });
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={showTxDialog} onOpenChange={setShowTxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มรายการ{txType === "income" ? "รายรับ" : "รายจ่าย"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={txType === "income" ? "default" : "outline"}
                onClick={() => { setTxType("income"); setTxCategory(""); }}
                className="gap-2"
              >
                <ArrowUpCircle className="w-4 h-4" />
                รายรับ
              </Button>
              <Button
                variant={txType === "expense" ? "destructive" : "outline"}
                onClick={() => { setTxType("expense"); setTxCategory(""); }}
                className="gap-2"
              >
                <ArrowDownCircle className="w-4 h-4" />
                รายจ่าย
              </Button>
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={txCategory} onValueChange={setTxCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {(txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>จำนวนเงิน (บาท)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม..."
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTxDialog(false)}>ยกเลิก</Button>
            <Button
              disabled={createTx.isPending || !txCategory || !txAmount}
              onClick={() =>
                createTx.mutate({
                  type: txType,
                  category: txCategory,
                  amount: Number(txAmount),
                  date: txDate,
                  note: txNote || undefined,
                })
              }
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yield Dialog */}
      <Dialog open={showYieldDialog} onOpenChange={setShowYieldDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกผลผลิต</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>ชื่อพืช/ผลผลิต</Label>
              <Input
                placeholder="เช่น มะเขือเทศ, ข้าวโพด"
                value={yieldCrop}
                onChange={(e) => setYieldCrop(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>น้ำหนัก (กก.)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0.0"
                  value={yieldKg}
                  onChange={(e) => setYieldKg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>ราคา/กก. (บาท)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={yieldPrice}
                  onChange={(e) => setYieldPrice(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>เกรด</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={yieldGrade === "A" ? "default" : "outline"}
                  onClick={() => setYieldGrade("A")}
                  className="gap-2"
                >
                  <Badge className="bg-yellow-500 text-white text-xs">A</Badge>
                  Grade A
                </Button>
                <Button
                  variant={yieldGrade === "B" ? "secondary" : "outline"}
                  onClick={() => setYieldGrade("B")}
                  className="gap-2"
                >
                  <Badge variant="secondary" className="text-xs">B</Badge>
                  Grade B
                </Button>
              </div>
            </div>
            {yieldKg && yieldPrice && (
              <div className="p-3 rounded-xl bg-primary/10 text-center">
                <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                <p className="text-xl font-bold text-primary">
                  ฿{formatCurrency(Number(yieldKg) * Number(yieldPrice))}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={yieldDate}
                onChange={(e) => setYieldDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม..."
                value={yieldNote}
                onChange={(e) => setYieldNote(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowYieldDialog(false)}>ยกเลิก</Button>
            <Button
              disabled={createYield.isPending || !yieldCrop || !yieldKg || !yieldPrice}
              onClick={() =>
                createYield.mutate({
                  cropName: yieldCrop,
                  kg: Number(yieldKg),
                  grade: yieldGrade,
                  pricePerKg: Number(yieldPrice),
                  date: yieldDate,
                  note: yieldNote || undefined,
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
