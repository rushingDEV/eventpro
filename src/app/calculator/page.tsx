import Link from "next/link";
import { CalculatorForm } from "@/components/calculator/calculator-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "מחשבון מושבים ריקים | EventPro",
  description:
    "גלו כמה כסף אתם מבזבזים על מושבים ריקים בחתונה. כלי חינמי לחישוב חיסכון מהושבה חכמה.",
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Event<span className="text-primary">Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              התחברות
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              הרשמה חינם
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black">
            כמה כסף אתם{" "}
            <span className="text-gradient-brand">מבזבזים</span>{" "}
            על מושבים ריקים?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            בממוצע, כל חתונה בישראל מבזבזת ₪5,000–₪15,000 על מנות
            שאף אחד לא יאכל. גלו כמה אתם עומדים לבזבז.
          </p>
        </div>

        <CalculatorForm />

        {/* Trust signals */}
        <div className="text-center pt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>100% חינם</span>
            <span className="text-border">|</span>
            <span>ללא הרשמה</span>
            <span className="text-border">|</span>
            <span>חישוב מיידי</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Event<span className="text-primary font-bold">Pro</span> ©{" "}
            {new Date().getFullYear()}
          </span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              דף הבית
            </Link>
            <Link
              href="/register"
              className="hover:text-foreground transition-colors"
            >
              הרשמה
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
