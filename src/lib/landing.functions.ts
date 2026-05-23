import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getLandingData = createServerFn({ method: "GET" }).handler(async () => {
  const [cats, items, tests, evts] = await Promise.all([
    supabaseAdmin
      .from("categories")
      .select("id,slug,title,subtitle,image_url,icon_key,item_count,gradient")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("collectibles")
      .select("id,slug,name,category,price_cents,image_url,badge,badge_color,views,likes,remaining,total,end_time")
      .eq("is_featured", true)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("testimonials")
      .select("id,name,role,avatar_url,quote,rating,result")
      .eq("approved", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("events")
      .select("id,title,event_date,location,attendees,status")
      .order("sort_order", { ascending: true }),
  ]);

  if (cats.error) throw new Error(cats.error.message);
  if (items.error) throw new Error(items.error.message);
  if (tests.error) throw new Error(tests.error.message);
  if (evts.error) throw new Error(evts.error.message);

  return {
    categories: cats.data ?? [],
    featured: items.data ?? [],
    testimonials: tests.data ?? [],
    events: evts.data ?? [],
  };
});

export const getLiveStats = createServerFn({ method: "GET" }).handler(async () => {
  const sinceIso = new Date(Date.now() - 60_000).toISOString();
  const [{ count: online }, { count: auctions }] = await Promise.all([
    supabaseAdmin
      .from("presence")
      .select("session_id", { count: "exact", head: true })
      .gt("last_seen", sinceIso),
    supabaseAdmin
      .from("collectibles")
      .select("id", { count: "exact", head: true })
      .gt("end_time", new Date().toISOString()),
  ]);
  return { online: online ?? 0, auctions: auctions ?? 0 };
});

export const heartbeatPresence = createServerFn({ method: "POST" })
  .inputValidator((data: { sessionId: string }) => {
    if (!data?.sessionId || typeof data.sessionId !== "string" || data.sessionId.length > 64) {
      throw new Error("Invalid session");
    }
    return data;
  })
  .handler(async ({ data }) => {
    await supabaseAdmin
      .from("presence")
      .upsert({ session_id: data.sessionId, last_seen: new Date().toISOString() });
    return { ok: true };
  });

export const incrementView = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => {
    if (!data?.id || typeof data.id !== "string") throw new Error("Invalid id");
    return data;
  })
  .handler(async ({ data }) => {
    const { data: cur } = await supabaseAdmin
      .from("collectibles").select("views").eq("id", data.id).maybeSingle();
    if (!cur) return { ok: false };
    await supabaseAdmin
      .from("collectibles")
      .update({ views: (cur.views ?? 0) + 1 })
      .eq("id", data.id);
    return { ok: true };
  });
