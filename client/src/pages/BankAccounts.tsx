import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/ScreenHeader";
import SlidePanel from "@/components/SlidePanel";

export default function BankAccounts() {
  const [open, setOpen] = useState(false);
  const [aiRecord, setAiRecord] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ bankName: "", accountName: "", accountNumber: "", currency: "USD", branchCode: "", swiftCode: "", accountType: "Current" });

  const { data: accounts = [], refetch } = trpc.bankRecon.listAccounts.useQuery({});
  const createMutation = trpc.bankRecon.createAccount.useMutation({
    onSuccess: () => { toast.success("Bank account created"); setOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const rows: any[] = Array.isArray(accounts) ? accounts : [];

  return (
    <DashboardLayout>
      {open && (
        <SlidePanel open={open} onClose={() => setOpen(false)} title="" width="xl">
          
            
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-sm font-medium">Bank Name *</Label><Input className="mt-1" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} /></div>
              <div className="col-span-2"><Label className="text-sm font-medium">Account Name *</Label><Input className="mt-1" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} /></div>
              <div><Label className="text-sm font-medium">Account Number *</Label><Input className="mt-1" value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))} /></div>
              <div><Label className="text-sm font-medium">Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["USD","GHS","EUR","GBP","ZAR"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-sm font-medium">Branch Code</Label><Input className="mt-1" value={form.branchCode} onChange={e => setForm(f => ({ ...f, branchCode: e.target.value }))} /></div>
              <div><Label className="text-sm font-medium">SWIFT Code</Label><Input className="mt-1" value={form.swiftCode} onChange={e => setForm(f => ({ ...f, swiftCode: e.target.value }))} /></div>
              <div><Label className="text-sm font-medium">Account Type</Label>
                <Select value={form.accountType} onValueChange={v => setForm(f => ({ ...f, accountType: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{["Current","Savings","Call"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                onClick={() => createMutation.mutate({ bankName: form.bankName, accountName: form.accountName, accountNumber: form.accountNumber, currency: form.currency, swiftBic: form.swiftCode, accountType: form.accountType })}
                disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
          
        </SlidePanel>
      )}
      {!open && (
        <div className="p-6 space-y-6">
        <ScreenHeader
  screenId="VFLBNKACC0001P001"
  title="Bank Accounts"
  subtitle="Registered bank accounts for payment processing"

          screenType="bank_accounts"
          onAIData={(rows) => setAiRecord(rows[0] ?? null)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((acc: any) => (
            <div key={acc.account_id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-[#e60000]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#e60000]" />
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{acc.currency}</Badge>
              </div>
              <div>
                <p className="font-semibold">{acc.bank_name}</p>
                <p className="text-sm text-muted-foreground">{acc.account_name}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{acc.account_number}</p>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>SWIFT: {acc.swift_code ?? "—"}</span>
                <span>{acc.account_type}</span>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No bank accounts registered yet</p>
            </div>
          )}
        </div>
        </div>
      )}
    </DashboardLayout>
  );
}
