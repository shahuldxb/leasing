import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Key, Users, CheckCircle, AlertTriangle, Copy, RefreshCw, Download, Plus } from "lucide-react";
import { toast } from "sonner";

export default function SSOConfig() {
  const [tab, setTab] = useState("saml");
  const [samlEnabled, setSamlEnabled] = useState(false);
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [samlConfig, setSamlConfig] = useState({
    provider: "azure_ad",
    entity_id: "https://vodalease-zs3ckgzv.manus.space",
    sso_url: "",
    certificate: "",
    attribute_email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    attribute_name: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
    attribute_role: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
  });
  const [oidcConfig, setOidcConfig] = useState({
    provider: "azure_ad",
    tenant_id: "",
    client_id: "",
    client_secret: "",
    authority: "https://login.microsoftonline.com/",
    scopes: "openid profile email",
  });

  const SP_METADATA_URL = "https://vodalease-zs3ckgzv.manus.space/api/auth/saml/metadata";
  const SP_ACS_URL = "https://vodalease-zs3ckgzv.manus.space/api/auth/saml/callback";
  const OIDC_REDIRECT_URI = "https://vodalease-zs3ckgzv.manus.space/api/auth/oidc/callback";

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied to clipboard`));
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SSO / Identity Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure SAML 2.0 and OpenID Connect for Azure AD, Okta, and other identity providers</p>
          </div>
          <Badge className={`text-sm px-3 py-1 border ${samlEnabled || oidcEnabled ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground border-border"}`}>
            {samlEnabled || oidcEnabled ? "SSO Active" : "SSO Disabled"}
          </Badge>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "SAML 2.0", value: samlEnabled ? "Enabled" : "Disabled", icon: Shield, color: samlEnabled ? "text-green-400" : "text-muted-foreground" },
            { label: "OpenID Connect", value: oidcEnabled ? "Enabled" : "Disabled", icon: Key, color: oidcEnabled ? "text-green-400" : "text-muted-foreground" },
            { label: "SSO Users", value: "0", icon: Users, color: "text-blue-400" },
            { label: "Last Auth Test", value: "—", icon: CheckCircle, color: "text-yellow-400" },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
                  <div>
                    <p className="text-lg font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OpenID Connect</TabsTrigger>
            <TabsTrigger value="sp-metadata">SP Metadata</TabsTrigger>
            <TabsTrigger value="role-mapping">Role Mapping</TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="mt-4 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-blue-400" /> SAML 2.0 Configuration</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Enable SAML SSO</Label>
                    <Switch checked={samlEnabled} onCheckedChange={setSamlEnabled} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Identity Provider</Label>
                  <Select value={samlConfig.provider} onValueChange={v => setSamlConfig(c => ({ ...c, provider: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azure_ad">Microsoft Azure AD</SelectItem>
                      <SelectItem value="okta">Okta</SelectItem>
                      <SelectItem value="adfs">Active Directory Federation Services (ADFS)</SelectItem>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="custom">Custom SAML Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">IdP SSO URL *</Label>
                    <Input className="mt-1" placeholder="https://login.microsoftonline.com/{tenant}/saml2" value={samlConfig.sso_url} onChange={e => setSamlConfig(c => ({ ...c, sso_url: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">SP Entity ID</Label>
                    <div className="flex gap-1 mt-1">
                      <Input value={samlConfig.entity_id} readOnly className="bg-muted/30 text-xs" />
                      <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => copyToClipboard(samlConfig.entity_id, "Entity ID")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium">IdP X.509 Certificate *</Label>
                  <textarea className="mt-1 w-full h-24 p-2 rounded-md border border-border bg-muted/20 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END CERTIFICATE-----"
                    value={samlConfig.certificate} onChange={e => setSamlConfig(c => ({ ...c, certificate: e.target.value }))} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Email Attribute</Label>
                    <Input className="mt-1 text-xs" value={samlConfig.attribute_email} onChange={e => setSamlConfig(c => ({ ...c, attribute_email: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Name Attribute</Label>
                    <Input className="mt-1 text-xs" value={samlConfig.attribute_name} onChange={e => setSamlConfig(c => ({ ...c, attribute_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Role Attribute</Label>
                    <Input className="mt-1 text-xs" value={samlConfig.attribute_role} onChange={e => setSamlConfig(c => ({ ...c, attribute_role: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => toast.info("SAML connection test — requires IdP configuration")}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Test Connection
                  </Button>
                  <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => toast.success("SAML configuration saved")}>
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oidc" className="mt-4 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm"><Key className="w-4 h-4 text-purple-400" /> OpenID Connect Configuration</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Enable OIDC SSO</Label>
                    <Switch checked={oidcEnabled} onCheckedChange={setOidcEnabled} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-medium">Identity Provider</Label>
                  <Select value={oidcConfig.provider} onValueChange={v => setOidcConfig(c => ({ ...c, provider: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azure_ad">Microsoft Azure AD / Entra ID</SelectItem>
                      <SelectItem value="okta">Okta</SelectItem>
                      <SelectItem value="google">Google Workspace</SelectItem>
                      <SelectItem value="auth0">Auth0</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium">Tenant ID / Domain</Label>
                    <Input className="mt-1" placeholder="your-tenant-id.onmicrosoft.com" value={oidcConfig.tenant_id} onChange={e => setOidcConfig(c => ({ ...c, tenant_id: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Client ID (Application ID)</Label>
                    <Input className="mt-1" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={oidcConfig.client_id} onChange={e => setOidcConfig(c => ({ ...c, client_id: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Client Secret</Label>
                    <Input type="password" className="mt-1" placeholder="••••••••••••••••" value={oidcConfig.client_secret} onChange={e => setOidcConfig(c => ({ ...c, client_secret: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Redirect URI (read-only)</Label>
                    <div className="flex gap-1 mt-1">
                      <Input value={OIDC_REDIRECT_URI} readOnly className="bg-muted/30 text-xs" />
                      <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => copyToClipboard(OIDC_REDIRECT_URI, "Redirect URI")}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => toast.info("OIDC test — requires valid credentials")}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Test Connection
                  </Button>
                  <Button className="flex-1 bg-[#e60000] hover:bg-[#cc0000] text-white" onClick={() => toast.success("OIDC configuration saved")}>
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sp-metadata" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">Service Provider (SP) Metadata</CardTitle>
                <p className="text-xs text-muted-foreground">Provide these details to your Identity Provider when configuring the SAML application</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "SP Metadata URL", value: SP_METADATA_URL },
                  { label: "Assertion Consumer Service (ACS) URL", value: SP_ACS_URL },
                  { label: "SP Entity ID", value: samlConfig.entity_id },
                  { label: "NameID Format", value: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" },
                  { label: "Binding", value: "HTTP-POST" },
                ].map((item) => (
                  <div key={item.label}>
                    <Label className="text-xs font-medium text-muted-foreground">{item.label}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={item.value} readOnly className="bg-muted/20 text-xs font-mono" />
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => copyToClipboard(item.value, item.label)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="mt-2" onClick={() => toast.info("SP metadata XML download — requires server configuration")}>
                  <Download className="w-4 h-4 mr-2" /> Download SP Metadata XML
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="role-mapping" className="mt-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm">IdP Group → VodaLease Role Mapping</CardTitle>
                <p className="text-xs text-muted-foreground">Map identity provider groups/roles to VodaLease RBAC roles</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { idp_group: "VodaLease-Admins", voda_role: "System Administrator", access: "Full access" },
                    { idp_group: "VodaLease-Finance", voda_role: "Finance Manager", access: "Lease, Payables, GL" },
                    { idp_group: "VodaLease-Approvers", voda_role: "Checker / Approver", access: "Maker/Checker queue" },
                    { idp_group: "VodaLease-ReadOnly", voda_role: "Read-Only Viewer", access: "View all, no edits" },
                    { idp_group: "VodaLease-Auditors", voda_role: "Internal Auditor", access: "Audit log, compliance" },
                  ].map((mapping, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10">
                      <div className="flex-1">
                        <p className="text-sm font-medium font-mono">{mapping.idp_group}</p>
                        <p className="text-xs text-muted-foreground">{mapping.access}</p>
                      </div>
                      <div className="text-muted-foreground text-xs">→</div>
                      <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">{mapping.voda_role}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toast.info("Edit mapping — coming soon")}>
                        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => toast.info("Add role mapping — coming soon")}>
                    <Plus className="w-4 h-4 mr-2" /> Add Role Mapping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

