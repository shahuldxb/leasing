import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Play, Download, Upload, GitBranch } from "lucide-react";
import { toast } from "sonner";

const PROCESS_TEMPLATES = [
  { id: "lease_approval", name: "Lease Approval Workflow" },
  { id: "invoice_approval", name: "Invoice Approval Workflow" },
  { id: "payment_run", name: "Payment Run Workflow" },
  { id: "lease_renewal", name: "Lease Renewal Workflow" },
  { id: "lease_termination", name: "Lease Termination Workflow" },
];

const DEFAULT_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_Maker" name="Maker: Submit">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:userTask id="Task_Checker" name="Checker: Approve">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_Maker" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_Maker" targetRef="Task_Checker" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Checker" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="155" y="125" width="30" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Maker_di" bpmnElement="Task_Maker">
        <dc:Bounds x="240" y="60" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Checker_di" bpmnElement="Task_Checker">
        <dc:Bounds x="400" y="60" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="562" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="569" y="125" width="23" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="188" y="100" /><di:waypoint x="240" y="100" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="340" y="100" /><di:waypoint x="400" y="100" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="500" y="100" /><di:waypoint x="562" y="100" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export default function WorkflowModeler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [selectedProcess, setSelectedProcess] = useState("lease_approval");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadModeler = async () => {
      try {
        // Dynamically load bpmn-js from CDN to avoid bundler issues
        if (!(window as any).BpmnJS) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/bpmn-js@17/dist/bpmn-modeler.development.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load BPMN.io"));
            document.head.appendChild(script);
          });
        }
        if (!mounted || !containerRef.current) return;
        const BpmnModeler = (window as any).BpmnJS;
        const modeler = new BpmnModeler({ container: containerRef.current });
        modelerRef.current = modeler;
        await modeler.importXML(DEFAULT_BPMN);
        setLoading(false);
      } catch (err) {
        console.error("BPMN modeler error:", err);
        setLoading(false);
      }
    };
    loadModeler();
    return () => { mounted = false; modelerRef.current?.destroy?.(); };
  }, []);

  const handleSave = async () => {
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      toast.success("Process definition saved");
      console.log("BPMN XML:", xml);
    } catch { toast.error("Failed to save process"); }
  };

  const handleExport = async () => {
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${selectedProcess}.bpmn`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to export"); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="w-6 h-6 text-[#e60000]" /> Process Modeler</h1>
            <p className="text-sm text-muted-foreground mt-1">Screen ID: VFWKFMODS0004P001 · Visual BPMN 2.0 workflow designer</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{PROCESS_TEMPLATES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => toast.info("Import BPMN file")}><Upload className="w-4 h-4 mr-1" />Import</Button>
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export</Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("Simulation coming soon")}><Play className="w-4 h-4 mr-1" />Simulate</Button>
            <Button className="bg-[#e60000] hover:bg-[#cc0000] text-white" size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" />Save</Button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-border overflow-hidden" style={{ minHeight: "600px" }}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#e60000] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading BPMN Modeler...</p>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" style={{ minHeight: "600px" }} />
        </div>
      </div>
    </DashboardLayout>
  );
}
