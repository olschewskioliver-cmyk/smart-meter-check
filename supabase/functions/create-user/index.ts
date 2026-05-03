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

    const { username, fullName, password, email, role } = await req.json();

    if (!username || !fullName || !password || !role) {
      return json({ error: "username, fullName, password und role sind Pflichtfelder" }, 400);
    }

    // Use real email or generate internal placeholder
    const authEmail = email?.trim() || `${username.toLowerCase().replace(/[^a-z0-9]/g, ".")}@intern.ovag-netz.de`;

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr) return json({ error: createErr.message }, 400);

    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: newUser.user.id,
      full_name: fullName,
      role,
      username,
      auth_email: authEmail,
      is_active: true,
    });

    if (profileErr) {
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return json({ error: profileErr.message }, 400);
    }

    return json({ success: true, userId: newUser.user.id });
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
