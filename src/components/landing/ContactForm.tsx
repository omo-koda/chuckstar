import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { submitContactMessage } from "@/lib/contact.functions";

const Schema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  subject: z.string().trim().max(150).optional().default(""),
  message: z.string().trim().min(1, "Message required").max(2000),
});

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const submit = useServerFn(submitContactMessage);
  const m = useMutation({
    mutationFn: (data: typeof form) => submit({ data }),
    onSuccess: () => {
      toast.success("Message sent", { description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: (e: any) => toast.error("Could not send", { description: e?.message ?? "Try again" }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    m.mutate(parsed.data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">Talk to us</h3>
          <p className="text-muted-foreground font-rajdhani">
            Questions about authentication, grading, or your collection? We reply within one business day.
          </p>
        </div>
        <ul className="space-y-4 font-rajdhani">
          <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">123 Collector's Lane, Suite 400<br/>Los Angeles, CA 90015</span></li>
          <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-accent" /><span className="text-muted-foreground">(555) 123-4567</span></li>
          <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-primary" /><span className="text-muted-foreground">hello@clickerverse.com</span></li>
        </ul>
      </div>

      <form onSubmit={onSubmit} className="glass rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            required maxLength={100}
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-background/60 border-primary/30 font-rajdhani"
          />
          <Input
            type="email" required maxLength={255}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-background/60 border-primary/30 font-rajdhani"
          />
        </div>
        <Input
          maxLength={150}
          placeholder="Subject (optional)"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="bg-background/60 border-primary/30 font-rajdhani"
        />
        <Textarea
          required maxLength={2000} rows={5}
          placeholder="Tell us about your collection or your question…"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="bg-background/60 border-primary/30 font-rajdhani resize-none"
        />
        <Button
          type="submit"
          disabled={m.isPending}
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 font-display font-bold"
        >
          <Send className="w-4 h-4 mr-2" />
          {m.isPending ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
