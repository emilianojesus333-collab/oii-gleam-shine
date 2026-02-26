import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, RefreshCw, CheckCircle, XCircle } from "lucide-react";

const TEST_EXERCISE_ID = "e0257625-e23f-42de-9d02-84522b4bbc60";
const TEST_SESSION_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001";

export default function DebugProgression() {
  const navigate = useNavigate();
  const [call1, setCall1] = useState<any>(null);
  const [call2, setCall2] = useState<any>(null);
  const [dbRow, setDbRow] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = async () => {
    setLoading(true);
    setError(null);
    setCall1(null);
    setCall2(null);
    setDbRow(null);

    try {
      // ── Call 1: Create/upsert ──
      console.log("[DEBUG] Call 1: Invoking progression-engine...");
      const { data: d1, error: e1 } = await supabase.functions.invoke("progression-engine", {
        body: { exercise_id: TEST_EXERCISE_ID, session_id: TEST_SESSION_ID },
      });
      if (e1) throw new Error(`Call 1 failed: ${e1.message}`);
      console.log("[DEBUG] Call 1 response:", JSON.stringify(d1, null, 2));
      setCall1(d1);

      // ── Call 2: Upsert (same ids) ──
      console.log("[DEBUG] Call 2: Re-invoking (UPSERT test)...");
      const { data: d2, error: e2 } = await supabase.functions.invoke("progression-engine", {
        body: { exercise_id: TEST_EXERCISE_ID, session_id: TEST_SESSION_ID },
      });
      if (e2) throw new Error(`Call 2 failed: ${e2.message}`);
      console.log("[DEBUG] Call 2 response:", JSON.stringify(d2, null, 2));
      setCall2(d2);

      // ── SELECT from progression_logs ──
      console.log("[DEBUG] Querying progression_logs...");
      const { data: row, error: rowErr } = await supabase
        .from("progression_logs")
        .select("*")
        .eq("exercise_id", TEST_EXERCISE_ID)
        .eq("session_id", TEST_SESSION_ID)
        .maybeSingle();

      if (rowErr) {
        console.error("[DEBUG] RLS/Query error:", rowErr);
        setError(`RLS/Query error: ${rowErr.message} (code: ${rowErr.code})`);
      } else {
        console.log("[DEBUG] progression_logs row:", JSON.stringify(row, null, 2));
        setDbRow(row);
      }
    } catch (err: any) {
      console.error("[DEBUG] Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${ok ? "text-green-400" : "text-red-400"}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/home")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Debug: Progression Engine</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parâmetros de teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm font-mono text-muted-foreground">
          <p>exercise_id: {TEST_EXERCISE_ID}</p>
          <p>session_id: {TEST_SESSION_ID}</p>
        </CardContent>
      </Card>

      <Button onClick={invoke} disabled={loading} className="w-full gap-2">
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        {loading ? "A executar..." : "Executar teste (2 chamadas + SELECT)"}
      </Button>

      {error && (
        <Card className="border-red-500/50">
          <CardContent className="pt-4">
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </CardContent>
        </Card>
      )}

      {call1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Chamada 1 (Create)
              <StatusBadge ok={call1.log_saved === true} label={call1.log_saved ? "log_saved ✓" : "log_saved ✗"} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-64 bg-muted p-3 rounded-lg">
              {JSON.stringify(call1, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {call2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Chamada 2 (UPSERT)
              <StatusBadge ok={call2.log_saved === true} label={call2.log_saved ? "log_saved ✓" : "log_saved ✗"} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-64 bg-muted p-3 rounded-lg">
              {JSON.stringify(call2, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {dbRow && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">progression_logs (SELECT)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-64 bg-muted p-3 rounded-lg">
              {JSON.stringify(dbRow, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
