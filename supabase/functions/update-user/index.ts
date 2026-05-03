import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify caller is admin
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token!);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "admin") return json({ error: "Forbidden" }, 403);

    const { action, userId, ...payload } = await req.json();

    switch (action) {
      case "deactivate": {
        await supabase.from("profiles").update({ is_active: false }).eq("id", userId);
        await supabase.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
        return json({ success: true });
      }
      case "reactivate": {
        await supabase.from("profiles").update({ is_active: true }).eq("id", userId);
        await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
        return json({ success: true });
      }
      case "change_role": {
        const { role } = payload;
        await supabase.from("profiles").update({ role }).eq("id", userId);
        return json({ success: true });
      }
      case "reset_password": {
        const { password } = payload;
        const { error } = await supabase.auth.admin.updateUserById(userId, { password });
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
      case "update_info": {
        const { fullName, username } = payload;
        const update: Record<string, string> = {};
        if (fullName) update.full_name = fullName;
        if (username) update.username = username;
        const { error } = await supabase.from("profiles").update(update).eq("id", userId);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
