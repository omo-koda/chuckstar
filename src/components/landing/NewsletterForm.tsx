import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { subscribeNewsletter } from "@/lib/contact.functions";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const subscribe = useServerFn(subscribeNewsletter);
  const navigate = useNavigate();
  void navigate;

  const m = useMutation({
    mutationFn: (email: string) => subscribe({ data: { email } }),
    onSuccess: () => {
      toast.success("You're in!", { description: "Watch your inbox for exclusive drops." });
      setEmail("");
    },
    onError: (e: any) => toast.error("Could not subscribe", { description: e?.message ?? "Try again later" }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) { toast.error("Please enter a valid email"); return; }
    m.mutate(parsed.data);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="pl-10 bg-background/60 border-primary/30 placeholder:text-muted-foreground font-rajdhani"
        />
      </div>
      <Button
        type="submit"
        disabled={m.isPending}
        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 font-display font-bold px-8 shadow-glow"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {m.isPending ? "Joining…" : "Subscribe"}
      </Button>
    </form>
  );
}
