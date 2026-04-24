import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ScreenHeader } from "@/components/ScreenHeader";
import {
  AlertTriangle, RefreshCw, DollarSign, FileText, Settings,
  CheckCircle, XCircle, Eye, ChevronDown
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const BOUNCE_REASONS = [
  { value: 'INSUFFICIENT_FUNDS', label: 'Insufficient Funds' },
  { value: 'ACCOUNT_CLOSED', label: 'Account Closed' },
  { value: 'SIGNATURE_MISMATCH', label: 'Signature Mismatch' },
  { value: 'STALE_CHEQUE', label: 'Stale Cheque (>6 months)' },
  { value: 'STOP_PAYMENT', label: 'Stop Payment Instruction' },
  { value: 'AMOUNT_MISMATCH', label: 'Amount Words/Figures Mismatch' },
  { value: 'OTHER', label: 'Other (specify in details)' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  BOUNCED: 'bg-red-500/20 text-red-400 border-red-500/30',
  REPLACEMENT_ISSUED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PENALTY_PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  RESOLVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  WAIVED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function fmt(n: number | null | undefined) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

// ── Record Bounce Dialog ──────────────────────────────────────────────────
function RecordBounceDialog({ open, onClose, chequeId, chequeNumber, chequeAmount, currency }: {
  open: boolean; onClose: () => void;
  chequeId: number; chequeNumber: string; chequeAmount: number; currency: string;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    bounceDate: new Date().toISOString().split('T')[0],
    bounceReason: 'INSUFFICIENT_FUNDS' as typeof BOUNCE_REASONS[number]['value'],
    bounceReasonDetail: '',
    bankReturnRef: '',
    configId: undefined as number | undefined,
    overridePenalty: undefined as number | undefined,
    waivePenalty: false,
    waiverReason: '',
  });

  const { data: configs } = trpc.bounceRecon.getPenaltyConfigs.useQuery({ activeOnly: true });
  const { data: preview } = trpc.bounceRecon.previewPenalty.useQuery(
    { chequeAmount, configId: form.configId },
    { enabled: !form.waivePenalty }
  );

  const recordMutation = trpc.bounceRecon.recordBounce.useMutation({
    onSuccess: (data) => {
      toast.success(`Bounce recorded — Ref: ${data?.bounce_ref}. Penalty: ${data?.currency} ${fmt(data?.penalty_amount)}`);
      utils.bounceRecon.getBounceHistory.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const penaltyDisplay = form.waivePenalty ? 0 : (form.overridePenalty ?? preview?.penalty_amount ?? 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Record Bounced Cheque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Cheque Info Banner */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <div><span className="text-gray-400">Cheque No:</span><br /><span className="font-mono font-bold">{chequeNumber}</span></div>
              <div><span className="text-gray-400">Amount:</span><br /><span className="font-bold text-white">{currency} {fmt(chequeAmount)}</span></div>
              <div><span className="text-gray-400">Cheque ID:</span><br /><span className="font-mono text-gray-300">#{chequeId}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Bounce Date *</Label>
              <Input type="date" value={form.bounceDate}
                onChange={e => setForm(f => ({ ...f, bounceDate: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Bank Return Reference</Label>
              <Input placeholder="e.g. RTN-2024-001234" value={form.bankReturnRef}
                onChange={e => setForm(f => ({ ...f, bankReturnRef: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Bounce Reason *</Label>
            <Select value={form.bounceReason} onValueChange={v => setForm(f => ({ ...f, bounceReason: v as any }))}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {BOUNCE_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-gray-100">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Additional Details</Label>
            <Textarea placeholder="Provide additional context or bank notification details..."
              value={form.bounceReasonDetail}
              onChange={e => setForm(f => ({ ...f, bounceReasonDetail: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white mt-1 h-16" />
          </div>

          {/* Penalty Section */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-yellow-400">Penalty Configuration</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Waive Penalty</span>
                <Switch checked={form.waivePenalty}
                  onCheckedChange={v => setForm(f => ({ ...f, waivePenalty: v }))} />
              </div>
            </div>

            {!form.waivePenalty && (
              <>
                <div>
                  <Label className="text-gray-300 text-xs">Penalty Rule</Label>
                  <Select value={form.configId?.toString() ?? ''}
                    onValueChange={v => setForm(f => ({ ...f, configId: v ? parseInt(v) : undefined, overridePenalty: undefined }))}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1 text-sm">
                      <SelectValue placeholder="Auto-select by amount" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="auto" className="text-gray-400">Auto-select by cheque amount</SelectItem>
                      {(configs?.configs ?? []).map((c: any) => (
                        <SelectItem key={c.config_id} value={c.config_id.toString()} className="text-gray-100">
                          {c.config_name} ({c.penalty_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {preview && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Calculated Penalty ({preview.penalty_type}):</span>
                      <span className="text-yellow-300 font-bold">{currency} {fmt(preview.penalty_amount)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400">Total (Cheque + Penalty):</span>
                      <span className="text-white font-bold">{currency} {fmt(preview.total_with_penalty)}</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-300 text-xs">Override Penalty Amount (optional)</Label>
                  <Input type="number" step="0.01" placeholder="Leave blank to use calculated amount"
                    value={form.overridePenalty ?? ''}
                    onChange={e => setForm(f => ({ ...f, overridePenalty: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="bg-gray-800 border-gray-600 text-white mt-1 text-sm" />
                </div>
              </>
            )}

            {form.waivePenalty && (
              <div>
                <Label className="text-gray-300 text-xs">Waiver Reason *</Label>
                <Textarea placeholder="Provide justification for waiving the penalty..."
                  value={form.waiverReason}
                  onChange={e => setForm(f => ({ ...f, waiverReason: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1 h-16 text-sm" />
              </div>
            )}

            <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2">
              <span className="text-gray-300">Final Penalty:</span>
              <span className={penaltyDisplay > 0 ? 'text-red-400' : 'text-green-400'}>
                {currency} {fmt(penaltyDisplay)}
                {form.waivePenalty && <span className="text-xs ml-1 text-purple-400">(WAIVED)</span>}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">Cancel</Button>
          <Button onClick={() => recordMutation.mutate({
            chequeId, bounceDate: form.bounceDate, bounceReason: form.bounceReason,
            bounceReasonDetail: form.bounceReasonDetail || undefined,
            bankReturnRef: form.bankReturnRef || undefined,
            configId: form.configId, overridePenalty: form.overridePenalty,
            waivePenalty: form.waivePenalty, waiverReason: form.waiverReason || undefined,
          })}
            disabled={recordMutation.isPending || (form.waivePenalty && !form.waiverReason)}
            className="bg-red-600 hover:bg-red-700 text-white">
            {recordMutation.isPending ? 'Recording...' : 'Record Bounce'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Issue Replacement Dialog ───────────────────────────────────────────────
function ReplacementDialog({ open, onClose, bounce }: {
  open: boolean; onClose: () => void; bounce: any;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    replacementBookId: '',
    includePenalty: true,
    replacementIssueDate: new Date().toISOString().split('T')[0],
    replacementDueDate: '',
    checkerNotes: '',
  });

  const { data: books } = trpc.cheque.getChequeBooks.useQuery({ status: 'Active' });
  const selectedBook = ((books as any)?.books ?? (books ?? [])).find((b: any) => b.book_id?.toString() === form.replacementBookId);
  const replacementAmount = form.includePenalty
    ? (bounce?.original_amount ?? 0) + (bounce?.penalty_amount ?? 0)
    : (bounce?.original_amount ?? 0);

  const issueMutation = trpc.bounceRecon.issueReplacement.useMutation({
    onSuccess: (data) => {
      toast.success(`Replacement cheque issued — #${data?.replacement_cheque_number}`);
      utils.bounceRecon.getBounceHistory.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-blue-400 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" /> Issue Replacement Cheque
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Bounce Summary */}
          <div className="bg-gray-800 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-400">Bounce Ref:</span><span className="font-mono text-red-400">{bounce?.bounce_ref}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Original Amount:</span><span className="text-white">{bounce?.currency} {fmt(bounce?.original_amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Penalty:</span><span className="text-yellow-400">{bounce?.currency} {fmt(bounce?.penalty_amount)}</span></div>
            <div className="flex justify-between border-t border-gray-700 pt-1 font-bold"><span className="text-gray-300">Total if penalty included:</span><span className="text-white">{bounce?.currency} {fmt((bounce?.original_amount ?? 0) + (bounce?.penalty_amount ?? 0))}</span></div>
          </div>

          {/* Include Penalty Toggle */}
          <div className="flex items-center justify-between bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
            <div>
              <p className="text-sm font-medium text-yellow-300">Include Penalty in Replacement Cheque</p>
              <p className="text-xs text-gray-400 mt-0.5">When enabled, replacement cheque covers original amount + penalty</p>
            </div>
            <Switch checked={form.includePenalty}
              onCheckedChange={v => setForm(f => ({ ...f, includePenalty: v }))} />
          </div>

          <div>
            <Label className="text-gray-300">Select Cheque Book *</Label>
            <Select value={form.replacementBookId} onValueChange={v => setForm(f => ({ ...f, replacementBookId: v }))}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                <SelectValue placeholder="Select active cheque book..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {((books as any)?.books ?? (books ?? [])).filter((b: any) => b.available_leaves > 0).map((b: any) => (
                  <SelectItem key={b.book_id} value={b.book_id.toString()} className="text-gray-100">
                    Book #{b.book_number} — {b.bank_name} | {b.available_leaves} leaves remaining
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBook && (
              <p className="text-xs text-green-400 mt-1">
                Next cheque number: {(selectedBook as any).series_from + (selectedBook as any).issued_leaves}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Issue Date *</Label>
              <Input type="date" value={form.replacementIssueDate}
                onChange={e => setForm(f => ({ ...f, replacementIssueDate: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Due Date (optional)</Label>
              <Input type="date" value={form.replacementDueDate}
                onChange={e => setForm(f => ({ ...f, replacementDueDate: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Checker Notes (optional)</Label>
            <Textarea placeholder="Add approval notes or instructions..."
              value={form.checkerNotes}
              onChange={e => setForm(f => ({ ...f, checkerNotes: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white mt-1 h-16" />
          </div>

          {/* Final Amount Banner */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm text-gray-300">Replacement Cheque Amount:</span>
            <span className="text-lg font-bold text-blue-300">{bounce?.currency} {fmt(replacementAmount)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">Cancel</Button>
          <Button
            disabled={!form.replacementBookId || issueMutation.isPending}
            onClick={() => issueMutation.mutate({
              bounceId: bounce.bounce_id,
              replacementBookId: parseInt(form.replacementBookId),
              replacementAmount,
              includePenaltyInCheque: form.includePenalty,
              replacementIssueDate: form.replacementIssueDate || undefined,
              replacementDueDate: form.replacementDueDate || undefined,
              checkerNotes: form.checkerNotes || undefined,
            })}
            className="bg-blue-600 hover:bg-blue-700 text-white">
            {issueMutation.isPending ? 'Issuing...' : 'Issue Replacement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Penalty Config Dialog ──────────────────────────────────────────────────
function PenaltyConfigDialog({ open, onClose, config }: { open: boolean; onClose: () => void; config?: any }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    configName: config?.config_name ?? '',
    penaltyCode: config?.penalty_code ?? 'FLAT_FEE',
    flatAmount: config?.flat_amount ?? 0,
    pctRate: config?.pct_rate ?? 0,
    pctCap: config?.pct_cap ?? '',
    pctFloor: config?.pct_floor ?? '',
    appliesFromAmount: config?.applies_to_amount_from ?? 0,
    appliesToAmount: config?.applies_to_amount_to ?? '',
    drGlAccount: config?.dr_gl_account ?? '',
    crGlAccount: config?.cr_gl_account ?? '',
    costCentre: config?.cost_centre ?? '',
    priority: config?.priority ?? 10,
    isActive: config?.is_active ?? true,
    notes: config?.notes ?? '',
  });

  const saveMutation = trpc.bounceRecon.savePenaltyConfig.useMutation({
    onSuccess: () => {
      toast.success('Penalty configuration saved');
      utils.bounceRecon.getPenaltyConfigs.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 flex items-center gap-2">
            <Settings className="h-5 w-5" /> {config ? 'Edit' : 'New'} Penalty Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-gray-300">Configuration Name *</Label>
              <Input value={form.configName} onChange={e => setForm(f => ({ ...f, configName: e.target.value }))}
                placeholder="e.g. Standard Bank Bounce Fee" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>

            <div>
              <Label className="text-gray-300">Penalty Type *</Label>
              <Select value={form.penaltyCode} onValueChange={v => setForm(f => ({ ...f, penaltyCode: v }))}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="FLAT_FEE" className="text-gray-100">Flat Fee</SelectItem>
                  <SelectItem value="PCT_AMOUNT" className="text-gray-100">Percentage of Cheque Amount</SelectItem>
                  <SelectItem value="FLAT_PLUS_PCT" className="text-gray-100">Flat Fee + Percentage</SelectItem>
                  <SelectItem value="BANK_CHARGE" className="text-gray-100">Bank Charge (manual entry)</SelectItem>
                  <SelectItem value="NONE" className="text-gray-100">No Penalty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">Priority (lower = higher priority)</Label>
              <Input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 10 }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>

          {(form.penaltyCode === 'FLAT_FEE' || form.penaltyCode === 'FLAT_PLUS_PCT') && (
            <div>
              <Label className="text-gray-300">Flat Amount</Label>
              <Input type="number" step="0.01" value={form.flatAmount}
                onChange={e => setForm(f => ({ ...f, flatAmount: parseFloat(e.target.value) || 0 }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          )}

          {(form.penaltyCode === 'PCT_AMOUNT' || form.penaltyCode === 'FLAT_PLUS_PCT') && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-300">Rate (%)</Label>
                <Input type="number" step="0.01" value={form.pctRate}
                  onChange={e => setForm(f => ({ ...f, pctRate: parseFloat(e.target.value) || 0 }))}
                  className="bg-gray-800 border-gray-600 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">Cap (max penalty)</Label>
                <Input type="number" step="0.01" value={form.pctCap}
                  onChange={e => setForm(f => ({ ...f, pctCap: e.target.value }))}
                  placeholder="No cap" className="bg-gray-800 border-gray-600 text-white mt-1" />
              </div>
              <div>
                <Label className="text-gray-300">Floor (min penalty)</Label>
                <Input type="number" step="0.01" value={form.pctFloor}
                  onChange={e => setForm(f => ({ ...f, pctFloor: e.target.value }))}
                  placeholder="No floor" className="bg-gray-800 border-gray-600 text-white mt-1" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Applies to Cheques From (amount)</Label>
              <Input type="number" step="0.01" value={form.appliesFromAmount}
                onChange={e => setForm(f => ({ ...f, appliesFromAmount: parseFloat(e.target.value) || 0 }))}
                className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Applies to Cheques Up To (amount)</Label>
              <Input type="number" step="0.01" value={form.appliesToAmount}
                onChange={e => setForm(f => ({ ...f, appliesToAmount: e.target.value }))}
                placeholder="No upper limit" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-300">Debit GL Account</Label>
              <Input value={form.drGlAccount} onChange={e => setForm(f => ({ ...f, drGlAccount: e.target.value }))}
                placeholder="e.g. 6520" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Credit GL Account</Label>
              <Input value={form.crGlAccount} onChange={e => setForm(f => ({ ...f, crGlAccount: e.target.value }))}
                placeholder="e.g. 2100" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
            <div>
              <Label className="text-gray-300">Cost Centre</Label>
              <Input value={form.costCentre} onChange={e => setForm(f => ({ ...f, costCentre: e.target.value }))}
                placeholder="e.g. FIN-001" className="bg-gray-800 border-gray-600 text-white mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-gray-300">Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes about this penalty configuration..."
              className="bg-gray-800 border-gray-600 text-white mt-1 h-16" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <Label className="text-gray-300">Active (will be applied to new bounces)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">Cancel</Button>
          <Button disabled={!form.configName || saveMutation.isPending}
            onClick={() => saveMutation.mutate({
              configId: config?.config_id,
              configName: form.configName,
              penaltyCode: form.penaltyCode as any,
              flatAmount: form.flatAmount,
              pctRate: form.pctRate,
              pctCap: form.pctCap ? parseFloat(form.pctCap as string) : undefined,
              pctFloor: form.pctFloor ? parseFloat(form.pctFloor as string) : undefined,
              appliesFromAmount: form.appliesFromAmount,
              appliesToAmount: form.appliesToAmount ? parseFloat(form.appliesToAmount as string) : undefined,
              drGlAccount: form.drGlAccount || undefined,
              crGlAccount: form.crGlAccount || undefined,
              costCentre: form.costCentre || undefined,
              priority: form.priority,
              isActive: form.isActive,
              notes: form.notes || undefined,
            })}
            className="bg-yellow-600 hover:bg-yellow-700 text-white">
            {saveMutation.isPending ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BounceManagement() {
  const [activeTab, setActiveTab] = useState('history');
  const [recordBounceOpen, setRecordBounceOpen] = useState(false);
  const [replacementOpen, setReplacementOpen] = useState(false);
  const [penaltyConfigOpen, setPenaltyConfigOpen] = useState(false);
  const [selectedBounce, setSelectedBounce] = useState<any>(null);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });

  // For demo: allow recording bounce from a known cheque
  const [demoMode, setDemoMode] = useState({ chequeId: 1, chequeNumber: 'CHQ-000001', chequeAmount: 50000, currency: 'AED' });

  const { data: history, isLoading } = trpc.bounceRecon.getBounceHistory.useQuery({
    status: filters.status || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    page: 1, pageSize: 50,
  });

  const { data: configs } = trpc.bounceRecon.getPenaltyConfigs.useQuery({ activeOnly: false });
  const utils = trpc.useUtils();

  const waiveMutation = trpc.bounceRecon.waiveBounce.useMutation({
    onSuccess: () => { toast.success('Penalty waived'); utils.bounceRecon.getBounceHistory.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const postGLMutation = trpc.bounceRecon.postGLEntry.useMutation({
    onSuccess: (d) => { toast.success(`GL entry posted — ${d?.journal_ref}`); utils.bounceRecon.getBounceHistory.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const bounces = history?.bounces ?? [];
  const stats = {
    total: bounces.length,
    pending: bounces.filter((b: any) => b.status === 'BOUNCED').length,
    replaced: bounces.filter((b: any) => b.status === 'REPLACEMENT_ISSUED').length,
    waived: bounces.filter((b: any) => b.status === 'WAIVED').length,
    totalPenalty: bounces.reduce((s: number, b: any) => s + (b.penalty_amount ?? 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <ScreenHeader
  screenId="VFLBNCMGR0001P001"
  title="Bounce Management"
  subtitle="Returned cheque and bounce tracking"
/>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Bounces', value: stats.total, color: 'text-white', icon: <FileText className="h-4 w-4" /> },
            { label: 'Pending Action', value: stats.pending, color: 'text-red-400', icon: <AlertTriangle className="h-4 w-4" /> },
            { label: 'Replaced', value: stats.replaced, color: 'text-blue-400', icon: <RefreshCw className="h-4 w-4" /> },
            { label: 'Waived', value: stats.waived, color: 'text-purple-400', icon: <CheckCircle className="h-4 w-4" /> },
            { label: 'Total Penalties', value: `AED ${fmt(stats.totalPenalty)}`, color: 'text-yellow-400', icon: <DollarSign className="h-4 w-4" /> },
          ].map((kpi, i) => (
            <Card key={i} className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">{kpi.icon}{kpi.label}</div>
                <div className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700 text-gray-300">Bounce History</TabsTrigger>
            <TabsTrigger value="configs" className="data-[state=active]:bg-gray-700 text-gray-300">Penalty Configurations</TabsTrigger>
          </TabsList>

          {/* ── Bounce History Tab ── */}
          <TabsContent value="history" className="mt-4">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              <Select value={filters.status} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300 w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all" className="text-gray-300">All Statuses</SelectItem>
                  <SelectItem value="BOUNCED" className="text-red-400">Bounced</SelectItem>
                  <SelectItem value="REPLACEMENT_ISSUED" className="text-blue-400">Replacement Issued</SelectItem>
                  <SelectItem value="PENALTY_PENDING" className="text-yellow-400">Penalty Pending</SelectItem>
                  <SelectItem value="WAIVED" className="text-purple-400">Waived</SelectItem>
                  <SelectItem value="RESOLVED" className="text-green-400">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-300 w-40" />
              <Input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-300 w-40" />
              <Button variant="outline" onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '' })}
                className="border-gray-600 text-gray-400">Clear</Button>
            </div>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 border-b border-gray-700">
                      <tr>
                        {['Bounce Ref', 'Cheque No', 'Lessor', 'Original Amt', 'Penalty', 'Bounce Reason', 'Status', 'Replacement', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-400 font-medium text-xs uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {isLoading ? (
                        <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading bounce history...</td></tr>
                      ) : bounces.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-12 text-gray-500">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                          No bounced cheques recorded yet
                        </td></tr>
                      ) : bounces.map((b: any) => (
                        <tr key={b.bounce_id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-red-400 text-xs">{b.bounce_ref}</td>
                          <td className="px-4 py-3 font-mono text-gray-300">{b.original_cheque_number}</td>
                          <td className="px-4 py-3 text-gray-300">{b.lessor_name ?? `Lessor #${b.lessor_id}`}</td>
                          <td className="px-4 py-3 text-white font-medium">{b.currency} {fmt(b.original_amount)}</td>
                          <td className="px-4 py-3">
                            {b.waiver_approved ? (
                              <span className="text-purple-400 text-xs">WAIVED</span>
                            ) : (
                              <span className="text-yellow-400">{b.currency} {fmt(b.penalty_amount)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{b.bounce_reason?.replace('_', ' ')}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs border ${STATUS_COLORS[b.status] ?? 'bg-gray-700 text-gray-300'}`}>
                              {b.status?.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-blue-400 text-xs">
                            {b.replacement_cheque_number ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 h-7 text-xs">
                                  Actions <ChevronDown className="h-3 w-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700 text-gray-100">
                                {b.status === 'BOUNCED' && (
                                  <DropdownMenuItem
                                    className="hover:bg-blue-600/20 cursor-pointer"
                                    onClick={() => { setSelectedBounce(b); setReplacementOpen(true); }}>
                                    <RefreshCw className="h-3 w-3 mr-2 text-blue-400" /> Issue Replacement
                                  </DropdownMenuItem>
                                )}
                                {b.status === 'BOUNCED' && b.penalty_amount > 0 && !b.penalty_gl_posted && (
                                  <DropdownMenuItem
                                    className="hover:bg-green-600/20 cursor-pointer"
                                    onClick={() => postGLMutation.mutate({ bounceId: b.bounce_id })}>
                                    <FileText className="h-3 w-3 mr-2 text-green-400" /> Post GL Entry
                                  </DropdownMenuItem>
                                )}
                                {b.status === 'BOUNCED' && !b.waiver_approved && (
                                  <DropdownMenuItem
                                    className="hover:bg-purple-600/20 cursor-pointer"
                                    onClick={() => {
                                      const reason = prompt('Enter waiver reason:');
                                      if (reason) waiveMutation.mutate({ bounceId: b.bounce_id, waiverReason: reason });
                                    }}>
                                    <XCircle className="h-3 w-3 mr-2 text-purple-400" /> Waive Penalty
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="hover:bg-gray-700 cursor-pointer text-gray-400">
                                  <Eye className="h-3 w-3 mr-2" /> View GL Preview
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Penalty Configurations Tab ── */}
          <TabsContent value="configs" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-400 text-sm">Configure flexible penalty rules applied automatically when a cheque bounces</p>
              <Button onClick={() => { setEditConfig(null); setPenaltyConfigOpen(true); }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm">
                <Settings className="h-4 w-4 mr-2" /> New Penalty Rule
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(configs?.configs ?? []).map((c: any) => (
                <Card key={c.config_id} className={`bg-gray-900 border-gray-700 ${!c.is_active ? 'opacity-50' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-sm text-white">{c.config_name}</CardTitle>
                      <Badge className={c.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-700 text-gray-400'}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-yellow-400 font-medium">{c.penalty_code?.replace('_', ' ')}</span>
                    </div>
                    {c.flat_amount > 0 && <div className="flex justify-between"><span className="text-gray-400">Flat Amount:</span><span className="text-white">{fmt(c.flat_amount)}</span></div>}
                    {c.pct_rate > 0 && <div className="flex justify-between"><span className="text-gray-400">Rate:</span><span className="text-white">{c.pct_rate}%</span></div>}
                    {c.pct_cap && <div className="flex justify-between"><span className="text-gray-400">Cap:</span><span className="text-white">{fmt(c.pct_cap)}</span></div>}
                    {c.pct_floor && <div className="flex justify-between"><span className="text-gray-400">Floor:</span><span className="text-white">{fmt(c.pct_floor)}</span></div>}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Applies to:</span>
                      <span className="text-gray-300">
                        {fmt(c.applies_to_amount_from)} — {c.applies_to_amount_to ? fmt(c.applies_to_amount_to) : '∞'}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-gray-400">Priority:</span><span className="text-gray-300">#{c.priority}</span></div>
                    {c.dr_gl_account && <div className="flex justify-between"><span className="text-gray-400">Dr/Cr GL:</span><span className="font-mono text-gray-300">{c.dr_gl_account} / {c.cr_gl_account}</span></div>}
                    <Button size="sm" variant="outline" onClick={() => { setEditConfig(c); setPenaltyConfigOpen(true); }}
                      className="w-full mt-2 border-gray-600 text-gray-300 text-xs h-7">
                      Edit Configuration
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <RecordBounceDialog
        open={recordBounceOpen}
        onClose={() => setRecordBounceOpen(false)}
        chequeId={demoMode.chequeId}
        chequeNumber={demoMode.chequeNumber}
        chequeAmount={demoMode.chequeAmount}
        currency={demoMode.currency}
      />

      {selectedBounce && (
        <ReplacementDialog
          open={replacementOpen}
          onClose={() => { setReplacementOpen(false); setSelectedBounce(null); }}
          bounce={selectedBounce}
        />
      )}

      <PenaltyConfigDialog
        open={penaltyConfigOpen}
        onClose={() => { setPenaltyConfigOpen(false); setEditConfig(null); }}
        config={editConfig}
      />
    </div>
  );
}
