"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const benefits = [
  "הושבה חכמה מבוססת AI",
  "חיסכון של אלפי שקלים",
  "ניהול מוזמנים ומתנות",
  "תוכנית קומה אינטראקטיבית",
];

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "שגיאה ביצירת החשבון");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError("נרשמת בהצלחה! אנא התחבר.");
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("שגיאה בתקשורת עם השרת");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-gradient-brand">Event</span>Pro
            </Link>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">הצטרפו ל-EventPro</CardTitle>
              <CardDescription>חינם לחלוטין, ללא כרטיס אשראי</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input id="name" name="name" placeholder="דנה ויוסי" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">סיסמה</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    minLength={6}
                    required
                    dir="ltr"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "נרשם..." : "הרשמה חינם"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  כבר יש לך חשבון?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    התחברות
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Benefits */}
          <div className="space-y-2">
            {benefits.map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
