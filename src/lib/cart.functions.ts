import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cart_items")
      .select("id,qty,collectible:collectibles(id,slug,name,price_cents,image_url,badge,badge_color)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ collectibleId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_items")
      .upsert(
        { user_id: context.userId, collectible_id: data.collectibleId, qty: 1 },
        { onConflict: "user_id,collectible_id", ignoreDuplicates: false },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ collectibleId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cart_items")
      .delete()
      .eq("collectible_id", data.collectibleId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyLikes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("likes").select("collectible_id");
    if (error) throw new Error(error.message);
    return { ids: (data ?? []).map((r) => r.collectible_id) };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ collectibleId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("likes")
      .select("collectible_id")
      .eq("collectible_id", data.collectibleId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("likes").delete().eq("collectible_id", data.collectibleId);
      if (error) throw new Error(error.message);
      return { liked: false };
    } else {
      const { error } = await context.supabase
        .from("likes")
        .insert({ user_id: context.userId, collectible_id: data.collectibleId });
      if (error) throw new Error(error.message);
      return { liked: true };
    }
  });
