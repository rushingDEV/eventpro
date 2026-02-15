"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("אימייל או סיסמה לא נכונים");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-hero">
      {/* Form Side */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-gradient-brand">Event</span>Pro
            </Link>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">ברוכים השבים</CardTitle>
              <CardDescription>התחברו לחשבון EventPro שלכם</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
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
                    required
                    dir="ltr"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "מתחבר..." : "התחברות"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  אין לך חשבון?{" "}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    הרשמה חינם
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-center text-xs text-muted-foreground">
            <div>
              <div className="text-sm font-bold text-primary">₪7,000</div>
              <div>חיסכון ממוצע</div>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="text-sm font-bold text-primary">30 שניות</div>
              <div>הושבה חכמה</div>
            </div>
            <div className="h-6 w-px bg-border" />
            <div>
              <div className="text-sm font-bold text-primary">100%</div>
              <div>דיגיטלי</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
