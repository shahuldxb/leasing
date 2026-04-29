/**
 * VodaLease Enterprise — Period-End Close Lock
 * Locks Posted rows for a month so they cannot be re-posted or modified
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lock, Unlock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

type PeriodRow = {
  period_year: number;
  period_month: number;
  month_name: string;
  is_closed: number;
  closed_at: string | null;
  closed_by: string | null;
  notes: string | null;
  posted_count: number;
  projected_count: number;
};

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PeriodClose() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [confirmClose, setConfirmClose] = useState<PeriodRow | null>(null);
  const [confirmReopen, setConfirmReopen] = useState<PeriodRow | null>(null);
  const [closeNotes, setCloseNotes] = useState('');

  const utils = trpc.useUtils();

  const { data: periods = [], isLoading } = trpc.lease.getPeriodCloseStatus.useQuery(
    { year },
    { retry: false }
  );

  const closeMut = trpc.lease.closePeriod.useMutation({
    onSuccess: () => {
      toast.success(`Period closed — all Posted rows are now Locked`);
      setConfirmClose(null);
      setCloseNotes('');
      utils.lease.getPeriodCloseStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const reopenMut = trpc.lease.reopenPeriod.useMutation({
    onSuccess: () => {
      toast.success(`Period reopened — Locked rows restored to Posted`);
      setConfirmReopen(null);
      utils.lease.getPeriodCloseStatus.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = periods as PeriodRow[];
  const closedCount   = rows.filter(r => r.is_closed).length;
  const openCount     = rows.filter(r => !r.is_closed).length;
  const totalPosted   = rows.reduce((s, r) => s + (r.posted_count || 0), 0);
  const totalProjected = rows.reduce((s, r) => s + (r.projected_count || 0), 0);

  // Determine the "current" month to highlight
  const nowMonth = new Date().getMonth() + 1;
  const nowYear  = new Date().getFullYear();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <ScreenHeader
          screenId="VFACC-PERDCLOSE-001"
          title="Period-End Close Lock"
          subtitle="Lock Posted periods to prevent re-posting — essential for audit integrity"
          icon={<Lock className="h-6 w-6 text-violet-400" />}
          actions={
            <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Closed Periods', value: closedCount,    icon: Lock,         color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Open Periods',   value: openCount,      icon: Unlock,       color: 'text-blue-400',   bg: 'bg-blue-500/10' },
            { label: 'Posted Rows',    value: totalPosted,    icon: CheckCircle,  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Projected Rows', value: totalProjected, icon: AlertTriangle, color: 'text-amber-400',  bg: 'bg-amber-500/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-card/60 border-border/50">
              <CardContent className="pt-4 pb-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Period grid */}
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {year} — Monthly Close Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows.map((row) => {
                  const isCurrent = row.period_year === nowYear && row.period_month === nowMonth;
                  const isClosed  = Boolean(row.is_closed);
                  return (
                    <div
                      key={row.period_month}
                      className={`rounded-lg border p-4 transition-colors ${
                        isClosed
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : isCurrent
                          ? 'bg-blue-500/10 border-blue-500/30'
                          : 'bg-card/40 border-border/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{MONTH_NAMES[row.period_month]}</span>
                          {isCurrent && <Badge className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">Current</Badge>}
                        </div>
                        {isClosed
                          ? <Badge className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30"><Lock className="h-3 w-3 mr-1 inline" />Closed</Badge>
                          : <Badge className="text-xs bg-muted text-muted-foreground border border-border"><Unlock className="h-3 w-3 mr-1 inline" />Open</Badge>}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-emerald-500/10 rounded p-2 text-center">
                          <div className="text-emerald-400 font-semibold text-base">{row.posted_count}</div>
                          <div className="text-muted-foreground">Posted</div>
                        </div>
                        <div className="bg-amber-500/10 rounded p-2 text-center">
                          <div className="text-amber-400 font-semibold text-base">{row.projected_count}</div>
                          <div className="text-muted-foreground">Projected</div>
                        </div>
                      </div>

                      {isClosed && row.closed_at && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Closed by <span className="text-foreground">{row.closed_by}</span> on{' '}
                          {new Date(row.closed_at).toLocaleDateString('en-ZA')}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!isClosed ? (
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs bg-violet-600 hover:bg-violet-700"
                            disabled={row.posted_count === 0}
                            onClick={() => { setConfirmClose(row); setCloseNotes(''); }}
                          >
                            <Lock className="h-3 w-3 mr-1" /> Close Period
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            onClick={() => setConfirmReopen(row)}
                          >
                            <Unlock className="h-3 w-3 mr-1" /> Reopen
                          </Button>
                        )}
                      </div>
                      {!isClosed && row.posted_count === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">No Posted rows — post periods first</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Close Dialog */}
      {confirmClose && (
        <Dialog open onOpenChange={() => setConfirmClose(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-violet-400" />
                Close {MONTH_NAMES[confirmClose.period_month]} {year}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                This will lock all <strong className="text-foreground">{confirmClose.posted_count} Posted</strong> rows for{' '}
                {MONTH_NAMES[confirmClose.period_month]} {year}. Locked rows cannot be re-posted or modified.
                This is an audit-integrity action.
              </p>
              <div>
                <Label>Close Notes (optional)</Label>
                <Textarea
                  placeholder="e.g. Month-end close approved by Finance Director…"
                  value={closeNotes}
                  onChange={e => setCloseNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmClose(null)}>Cancel</Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                disabled={closeMut.isPending}
                onClick={() => closeMut.mutate({
                  year: confirmClose.period_year,
                  month: confirmClose.period_month,
                  notes: closeNotes || undefined,
                })}>
                {closeMut.isPending ? 'Closing…' : 'Confirm Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Reopen Dialog */}
      {confirmReopen && (
        <Dialog open onOpenChange={() => setConfirmReopen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-amber-400" />
                Reopen {MONTH_NAMES[confirmReopen.period_month]} {year}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              Reopening will restore all Locked rows to Posted status for{' '}
              {MONTH_NAMES[confirmReopen.period_month]} {year}. This should only be done with appropriate authorisation.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmReopen(null)}>Cancel</Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                disabled={reopenMut.isPending}
                onClick={() => reopenMut.mutate({
                  year: confirmReopen.period_year,
                  month: confirmReopen.period_month,
                })}>
                {reopenMut.isPending ? 'Reopening…' : 'Confirm Reopen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
