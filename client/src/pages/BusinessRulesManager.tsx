import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import ScreenHeader from "@/components/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Search, Filter, ToggleLeft, ToggleRight, Pencil, Trash2,
  RefreshCw, Loader2, ChevronDown, ChevronRight, BookOpen, Calculator,
  Shield, FileText, CheckCircle2, XCircle, Layers, Save, X
} from "lucide-react";
import { toast } from "sonner";

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  STANDARD_REF: { icon: BookOpen, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Standard Reference" },
  CALCULATION: { icon: Calculator, color: "text-blue-400 bg-blue-500/10 border-blue-500/30", label: "Calculation" },
  VALIDATION: { icon: Shield, color: "text-violet-400 bg-violet-500/10 border-violet-500/30", label: "Validation" },
  JV_PATTERN: { icon: FileText, color: "text-orange-400 bg-orange-500/10 border-orange-500/30", label: "JV Pattern" },
  RECOGNITION: { icon: CheckCircle2, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", label: "Recognition" },
  MEASUREMENT: { icon: Layers, color: "text-pink-400 bg-pink-500/10 border-pink-500/30", label: "Measurement" },
  CLASSIFICATION: { icon: Filter, color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Classification" },
};

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat] || { icon: BookOpen, color: "text-muted-foreground bg-muted/10 border-border", label: cat };
}

export default function BusinessRulesManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterActive, setFilterActive] = useState<string>("ALL");
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ rule_name: "", formula: "", jv_pattern: "", ifrs_reference: "", rule_definition_json: "" });

  // Fetch all rules
  const { data: allRules, isLoading, refetch } = trpc.businessRules.getAll.useQuery(undefined, {
    staleTime: 30_000,
  });

  // Fetch summary
  const { data: summary } = trpc.businessRules.getSummary.useQuery(undefined, {
    staleTime: 30_000,
  });

  const toggleMutation = trpc.businessRules.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Rule status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const upsertMutation = trpc.businessRules.upsert.useMutation({
    onSuccess: () => { refetch(); setEditingRule(null); toast.success("Rule updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.businessRules.deleteByScreen.useMutation({
    onSuccess: () => { refetch(); toast.success("Screen rules deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const regenerateMutation = trpc.genai.generateBusinessRules.useMutation({
    onSuccess: () => { refetch(); toast.success("Business rules regenerated from AI"); },
    onError: (e) => toast.error(`Regeneration failed: ${e.message}`),
  });

  // Group rules by screen_id
  const groupedRules = useMemo(() => {
    if (!allRules) return {};
    const filtered = allRules.filter((r: any) => {
      const matchSearch = !searchTerm ||
        r.rule_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.screen_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ifrs_reference?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === "ALL" || r.rule_category === filterCategory;
      const matchActive = filterActive === "ALL" ||
        (filterActive === "ACTIVE" && r.is_active) ||
        (filterActive === "INACTIVE" && !r.is_active);
      return matchSearch && matchCategory && matchActive;
    });

    const groups: Record<string, any[]> = {};
    filtered.forEach((r: any) => {
      const sid = r.screen_id || "UNKNOWN";
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(r);
    });
    return groups;
  }, [allRules, searchTerm, filterCategory, filterActive]);

  const screenIds = Object.keys(groupedRules).sort();

  const toggleScreen = (sid: string) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const expandAll = () => setExpandedScreens(new Set(screenIds));
  const collapseAll = () => setExpandedScreens(new Set());

  const startEdit = (rule: any) => {
    setEditingRule(rule);
    setEditForm({
      rule_name: rule.rule_name || "",
      formula: rule.formula || "",
      jv_pattern: rule.jv_pattern || "",
      ifrs_reference: rule.ifrs_reference || "",
      rule_definition_json: rule.rule_definition_json ? (typeof rule.rule_definition_json === "string" ? rule.rule_definition_json : JSON.stringify(rule.rule_definition_json, null, 2)) : "",
    });
  };

  const saveEdit = () => {
    if (!editingRule) return;
    upsertMutation.mutate({
      ruleId: editingRule.rule_id,
      screenId: editingRule.screen_id,
      ruleType: editingRule.rule_type,
      ruleCategory: editingRule.rule_category,
      ruleName: editForm.rule_name,
      formula: editForm.formula || null,
      jvPattern: editForm.jv_pattern || null,
      ifrsReference: editForm.ifrs_reference || null,
      ruleDefinitionJson: editForm.rule_definition_json || null,
      priority: editingRule.priority,
      isActive: editingRule.is_active,
    });
  };

  const totalRules = allRules?.length || 0;
  const activeRules = allRules?.filter((r: any) => r.is_active).length || 0;
  const categories = [...new Set((allRules || []).map((r: any) => r.rule_category))].filter(Boolean);

  return (
    <div className="space-y-4">
      <ScreenHeader
        screenId="VFLBRULESMGR001"
        title="Business Rules Manager"
        subtitle="AI-generated IFRS 16 business rules engine — view, edit, activate/deactivate rules across all screens"
        icon={<Sparkles className="w-4 h-4 text-yellow-400" />}
        screenType="business_rules_manager"
        onAIData={() => {}}
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={expandAll}>
              <ChevronDown className="w-3 h-3" /> Expand All
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={collapseAll}>
              <ChevronRight className="w-3 h-3" /> Collapse All
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Total Rules</p>
          <p className="text-2xl font-bold text-yellow-400">{totalRules}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Active Rules</p>
          <p className="text-2xl font-bold text-emerald-400">{activeRules}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Inactive Rules</p>
          <p className="text-2xl font-bold text-red-400">{totalRules - activeRules}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Screens Configured</p>
          <p className="text-2xl font-bold text-blue-400">{screenIds.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search rules by name, screen ID, or IFRS reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{getCategoryConfig(c).label}</option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="h-8 text-xs bg-background border border-border rounded-md px-2 text-foreground"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active Only</option>
          <option value="INACTIVE">Inactive Only</option>
        </select>
      </div>

      {/* Rules grouped by screen */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading business rules...</span>
        </div>
      ) : screenIds.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-lg">
          <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No Business Rules Generated Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Navigate to any screen and press <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Alt+4</kbd> or
            click the <strong>Alt Seq</strong> button to generate business rules from AI.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {screenIds.map(sid => {
            const rules = groupedRules[sid];
            const isExpanded = expandedScreens.has(sid);
            const activeCount = rules.filter((r: any) => r.is_active).length;

            return (
              <div key={sid} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Screen header row */}
                <div role="button" tabIndex={0}
                  onClick={() => toggleScreen(sid)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-yellow-500/30 text-yellow-400 bg-yellow-500/5">
                      {sid}
                    </Badge>
                    <span className="text-sm font-medium text-foreground">{rules[0]?.screen_id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      {activeCount} active
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {rules.length} rules
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Regenerate all rules for ${sid} from AI? This will replace existing rules.`)) {
                          regenerateMutation.mutate({ screenId: sid });
                        }
                      }}
                      disabled={regenerateMutation.isPending}
                      title="Regenerate rules from AI"
                    >
                      {regenerateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete all ${rules.length} rules for ${sid}?`)) {
                          deleteMutation.mutate({ screenId: sid });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Expanded rules */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/20 text-muted-foreground">
                          <th className="text-left px-4 py-2 font-medium w-8">#</th>
                          <th className="text-left px-4 py-2 font-medium">Category</th>
                          <th className="text-left px-4 py-2 font-medium">Rule Name</th>
                          <th className="text-left px-4 py-2 font-medium">IFRS Ref</th>
                          <th className="text-left px-4 py-2 font-medium">Formula</th>
                          <th className="text-center px-4 py-2 font-medium w-16">Active</th>
                          <th className="text-left px-4 py-2 font-medium w-20">Version</th>
                          <th className="text-center px-4 py-2 font-medium w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule: any, idx: number) => {
                          const catCfg = getCategoryConfig(rule.rule_category);
                          const CatIcon = catCfg.icon;
                          return (
                            <tr key={rule.rule_id} className="border-t border-border/50 hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-2 text-muted-foreground font-mono">{idx + 1}</td>
                              <td className="px-4 py-2">
                                <Badge variant="outline" className={`text-[10px] gap-1 ${catCfg.color}`}>
                                  <CatIcon className="w-2.5 h-2.5" />
                                  {catCfg.label}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 font-medium text-foreground max-w-[300px] truncate" title={rule.rule_name}>
                                {rule.rule_name}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground font-mono">
                                {rule.ifrs_reference || "—"}
                              </td>
                              <td className="px-4 py-2 text-muted-foreground font-mono max-w-[200px] truncate" title={rule.formula}>
                                {rule.formula || "—"}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => toggleMutation.mutate({ ruleId: rule.rule_id, isActive: !rule.is_active })}
                                  className="inline-flex"
                                  title={rule.is_active ? "Click to deactivate" : "Click to activate"}
                                >
                                  {rule.is_active ? (
                                    <ToggleRight className="w-5 h-5 text-emerald-400" />
                                  ) : (
                                    <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                                  )}
                                </button>
                              </td>
                              <td className="px-4 py-2 text-muted-foreground font-mono">
                                v{rule.version ?? 1}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => startEdit(rule)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit overlay — full screen */}
      {editingRule && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-950/40 to-black shrink-0">
            <div className="flex items-center gap-3">
              <Pencil className="w-5 h-5 text-yellow-400" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-100">Edit Business Rule</h2>
                <p className="text-xs text-yellow-400/70">
                  {editingRule.screen_id} — Rule #{editingRule.rule_id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={saveEdit}
                disabled={upsertMutation.isPending}
                className="gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-semibold text-xs"
              >
                {upsertMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingRule(null)} className="text-muted-foreground hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Rule Name</label>
                  <Input
                    value={editForm.rule_name}
                    onChange={(e) => setEditForm(f => ({ ...f, rule_name: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">IFRS Reference</label>
                  <Input
                    value={editForm.ifrs_reference}
                    onChange={(e) => setEditForm(f => ({ ...f, ifrs_reference: e.target.value }))}
                    className="text-sm font-mono"
                    placeholder="e.g., IFRS 16.42(b)"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Formula</label>
                <Input
                  value={editForm.formula}
                  onChange={(e) => setEditForm(f => ({ ...f, formula: e.target.value }))}
                  className="text-sm font-mono"
                  placeholder="e.g., new_rent = current_rent * (1 + cpi_rate)"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">JV Pattern</label>
                <Textarea
                  value={editForm.jv_pattern}
                  onChange={(e) => setEditForm(f => ({ ...f, jv_pattern: e.target.value }))}
                  className="text-sm font-mono min-h-[100px]"
                  placeholder="Dr  Right-of-Use Asset  XXX&#10;Cr  Lease Liability      XXX"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Rule Definition (JSON)</label>
                <Textarea
                  value={editForm.rule_definition_json}
                  onChange={(e) => setEditForm(f => ({ ...f, rule_definition_json: e.target.value }))}
                  className="text-sm font-mono min-h-[200px]"
                  placeholder='{"condition": "...", "action": "..."}'
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="outline" className={`mt-1 ${getCategoryConfig(editingRule.rule_category).color}`}>
                    {getCategoryConfig(editingRule.rule_category).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-mono text-foreground mt-1">{editingRule.rule_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created by AI</p>
                  <p className="text-sm text-foreground mt-1">{editingRule.created_by_ai ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
