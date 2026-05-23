import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Clicker Verse" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({
      email: z.string().trim().email(),
      password: z.string().min(6),
    }).safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardContent className="p-8">
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="Clicker Verse" className="w-12 h-12" />
            <h1 className="font-display text-xl font-bold">CLICKER <span className="text-primary">VERSE</span></h1>
          </Link>
          <h2 className="font-display text-2xl font-bold text-center mb-2">Sign in</h2>
          <p className="text-muted-foreground font-rajdhani text-center mb-6">Welcome back, collector.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="bg-background/60 border-primary/30" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/60 border-primary/30" />
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent font-display font-bold">
              <Sparkles className="w-4 h-4 mr-2" />{loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground font-rajdhani mt-6">
            No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
