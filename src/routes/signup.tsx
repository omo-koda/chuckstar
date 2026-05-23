import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Clicker Verse" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.object({
      name: z.string().trim().min(1).max(100),
      email: z.string().trim().email(),
      password: z.string().min(6).max(72),
    }).safeParse({ name, email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: parsed.data.name },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Account created! Check your email to confirm.");
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
          <h2 className="font-display text-2xl font-bold text-center mb-2">Create account</h2>
          <p className="text-muted-foreground font-rajdhani text-center mb-6">Start your collection journey.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="bg-background/60 border-primary/30" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="bg-background/60 border-primary/30" />
            <Input type="password" placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-background/60 border-primary/30" />
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent font-display font-bold">
              <Sparkles className="w-4 h-4 mr-2" />{loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground font-rajdhani mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
