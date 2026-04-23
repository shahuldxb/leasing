import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SAMPLE_QUERIES = [
  "Show me all leases expiring in the next 90 days",
  "What is the total lease liability by asset type?",
  "List all overdue invoices with amounts greater than $10,000",
  "Show monthly depreciation for all tower site leases",
  "Which lessors have the most active leases?",
];

export default function MISAIQuery() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const queryMutation = trpc.genai.naturalLanguageQuery.useMutation({
    onSuccess: (data) => setResult(data),
    onError: (e) => toast.error(e.message),
  });

  const handleQuery = () => {
    if (!query.trim()) { toast.error("Please enter a query"); return; }
    setResult(null);
    queryMutation.mutate({ question: query });
  };

  const resultRows: any[] = result?.rows ?? [];
  const columns: string[] = resultRows.length > 0 ? Object.keys(resultRows[0]) : [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="w-6 h-6 text-[#e60000]" /> AI Query Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Screen ID: VFMISAIQR0001P001 · Natural language to SQL via LangChain + Azure OpenAI GPT-4o</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#e60000]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-4 h-4 text-[#e60000]" />
            </div>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Ask a question about your lease portfolio in plain English..."
                className="min-h-[80px] resize-none"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleQuery(); }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Press Ctrl+Enter to submit</p>
                <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white"
                  onClick={handleQuery} disabled={queryMutation.isPending}>
                  {queryMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Querying...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Run Query</>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Sample queries:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map(q => (
                <button key={q} className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground px-3 py-1.5 rounded-full transition-colors"
                  onClick={() => setQuery(q)}>{q}</button>
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Query Results</h3>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{resultRows.length} rows</Badge>
                {result.sql && <Badge variant="outline" className="text-xs font-mono">SQL Generated</Badge>}
              </div>
            </div>

            {result.sql && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Generated SQL:</p>
                <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap">{result.sql}</pre>
              </div>
            )}

            {result.explanation && (
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            )}

            {resultRows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {columns.map(c => <TableHead key={c} className="text-xs">{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultRows.slice(0, 50).map((row: any, i: number) => (
                      <TableRow key={i} className="text-sm hover:bg-muted/30">
                        {columns.map(c => <TableCell key={c} className="text-xs">{String(row[c] ?? "—")}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {resultRows.length > 50 && <p className="text-xs text-muted-foreground mt-2 text-center">Showing 50 of {resultRows.length} rows</p>}
              </div>
            )}

            {resultRows.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No results returned</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
