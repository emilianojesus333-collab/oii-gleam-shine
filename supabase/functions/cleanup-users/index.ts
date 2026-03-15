import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Developer account to KEEP
    const keepUserId = "a72d670d-991c-4d12-be93-7a700cfe666a";

    // Get all users
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;

    const usersToDelete = users.filter((u) => u.id !== keepUserId);
    const results: string[] = [];

    for (const user of usersToDelete) {
      const userId = user.id;
      const tables = [
        "workout_sets",
        "planned_exercises",
        "progression_logs",
        "body_measurements",
        "messages",
        "conversations",
        "nutrition_logs",
        "nutrition_profiles",
        "one_rm_records",
        "recovery_logs",
        "user_settings",
        "user_subscriptions",
        "workout_sessions",
      ];

      for (const table of tables) {
        await adminClient.from(table).delete().eq("user_id", userId);
      }

      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteErr) {
        results.push(`FAIL ${user.email}: ${deleteErr.message}`);
      } else {
        results.push(`OK ${user.email}`);
      }
    }

    return new Response(JSON.stringify({ deleted: results.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
