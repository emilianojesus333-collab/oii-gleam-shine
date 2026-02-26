import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

// Test 1: No auth → 401
Deno.test("progression-engine rejects unauthenticated requests", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/progression-engine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exercise_id: "test", session_id: "test" }),
  });
  const body = await res.text();
  assertEquals(res.status, 401, `Expected 401, got ${res.status}: ${body}`);
});

// Test 2: Auth + valid data → 200 + log_saved
Deno.test("progression-engine creates log with authenticated user", async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "emilianodejesusdafunseca99@gmail.com",
    password: Deno.env.get("TEST_USER_PASSWORD") || "",
  });

  if (authError || !authData.session) {
    console.log("⚠️ Cannot test authenticated flow - no test password available");
    return;
  }

  const token = authData.session.access_token;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/progression-engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      exercise_id: "e0257625-e23f-42de-9d02-84522b4bbc60",
      session_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001",
    }),
  });

  const body = await res.json();
  console.log("Response:", JSON.stringify(body, null, 2));
  assertEquals(res.status, 200);
  assertEquals(body.decision !== undefined, true, "Should have decision");
  assertEquals(body.log_saved, true, "Log should be saved");
});

// Test 3: Missing session_id → 400
Deno.test("progression-engine rejects missing session_id", async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: "emilianodejesusdafunseca99@gmail.com",
    password: Deno.env.get("TEST_USER_PASSWORD") || "",
  });

  if (authError || !authData.session) {
    console.log("⚠️ Cannot test - no test password available");
    return;
  }

  const token = authData.session.access_token;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/progression-engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ exercise_id: "e0257625-e23f-42de-9d02-84522b4bbc60" }),
  });

  const body = await res.text();
  assertEquals(res.status, 400, `Expected 400, got ${res.status}: ${body}`);
});
