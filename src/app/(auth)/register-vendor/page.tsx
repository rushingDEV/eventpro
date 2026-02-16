"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Store, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AREA_OPTIONS } from "@/lib/vendor-utils";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

const benefits = [
  "חשיפה לאלפי זוגות מתכננים",
  "ניהול לידים ופניות חכם",
  "פרופיל עסקי מקצועי עם גלריה",
  "דירוג וביקורות מאומתים",
];

export default function RegisterVendorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2 fields
  const [businessName, setBusinessName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    fetch("/api/marketplace/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  function handleNext() {
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("נא למלא את כל השדות");
      return;
    }
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!businessName || !categoryId || !city) {
      setError("נא למלא את כל שדות החובה");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          businessName,
          categoryId,
          city,
          contactPhone,
        }),
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
        router.push("/login");
      } else {
        router.push("/vendor");
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
            <div className="flex items-center justify-center gap-2 mt-2">
              <Store className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">הרשמת ספקים</span>
            </div>
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">
                {step === 1 ? "הצטרפו כספקים" : "פרטי העסק"}
              </CardTitle>
              <CardDescription>
                {step === 1
                  ? "שלב 1 מתוך 2 — פרטים אישיים"
                  : "שלב 2 מתוך 2 — פרטי עסק"}
              </CardDescription>
              {/* Step indicator */}
              <div className="flex justify-center gap-2 mt-3">
                <div
                  className={`h-1.5 w-16 rounded-full ${
                    step >= 1 ? "bg-gradient-brand" : "bg-muted"
                  }`}
                />
                <div
                  className={`h-1.5 w-16 rounded-full ${
                    step >= 2 ? "bg-gradient-brand" : "bg-muted"
                  }`}
                />
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">שם מלא</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ישראל ישראלי"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">אימייל</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@business.com"
                        required
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">סיסמה</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        required
                        dir="ltr"
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">שם העסק *</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="למשל: סטודיו לצילום - שם העסק"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>קטגוריה *</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחרו קטגוריה" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>עיר *</Label>
                      <Select value={city} onValueChange={setCity}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחרו אזור" />
                        </SelectTrigger>
                        <SelectContent>
                          {AREA_OPTIONS.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">טלפון (אופציונלי)</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="050-1234567"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                {step === 1 ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleNext}
                  >
                    הבא
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="w-full space-y-2">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-brand hover:opacity-90 text-white"
                      disabled={loading}
                    >
                      {loading ? (
                        "יוצר חשבון..."
                      ) : (
                        <>
                          <Sparkles className="ml-2 h-4 w-4" />
                          צור חשבון ספק
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setStep(1);
                        setError("");
                      }}
                    >
                      <ArrowRight className="ml-2 h-4 w-4" />
                      חזרה
                    </Button>
                  </div>
                )}
                <p className="text-sm text-muted-foreground text-center">
                  כבר יש לך חשבון?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-medium"
                  >
                    התחברות
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Benefits */}
          <div className="space-y-2">
            {benefits.map((b) => (
              <div
                key={b}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
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
