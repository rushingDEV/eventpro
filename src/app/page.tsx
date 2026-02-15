import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Brain,
  TrendingDown,
  MessageCircle,
  Map,
  Gift,
  ClipboardCheck,
  ArrowLeft,
  Sparkles,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "הושבה חכמה AI",
    description:
      "אלגוריתם גנטי שמסדר הושבה מושלמת ב-30 שניות — מה שלוקח שעות ידנית",
  },
  {
    icon: TrendingDown,
    title: "Dead Seat Eliminator",
    description:
      "מראה בזמן אמת כמה כסף אתם מבזבזים על מושבים ריקים ומתקן אוטומטית",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp RSVP",
    description:
      "אישורי הגעה דרך WhatsApp עם שאלות מותאמות — כולל חו\"ל",
  },
  {
    icon: Map,
    title: "תוכנית קומה אינטראקטיבית",
    description:
      "מפת הושבה ויזואלית עם שולחנות, כיסאות, גרירה ושחרור",
  },
  {
    icon: Gift,
    title: "מעקב מתנות",
    description:
      "מעקב מתנות מלא — מזומן, המחאות, העברות, Bit — הכל במקום אחד",
  },
  {
    icon: ClipboardCheck,
    title: "קבלת פנים דיגיטלית",
    description:
      "צ׳ק-אין מהיר באייפד עם חיפוש שם ושיוך שולחן אוטומטי",
  },
];

const pricingTiers = [
  {
    name: "חינם",
    price: "₪0",
    description: "להתחיל לתכנן",
    features: [
      "עד 200 מוזמנים",
      "הושבה ידנית",
      "תוכנית קומה 2D",
      "מעקב מתנות בסיסי",
    ],
    cta: "התחילו בחינם",
    highlighted: false,
  },
  {
    name: "פרו",
    price: "₪499",
    description: "הכי פופולרי",
    features: [
      "ללא הגבלת מוזמנים",
      "AI Smart Seating",
      "Dead Seat Optimizer",
      "WhatsApp RSVP",
      "ייצוא Excel",
    ],
    cta: "בחרו פרו",
    highlighted: true,
  },
  {
    name: "פרימיום",
    price: "₪999",
    description: "חוויה מלאה",
    features: [
      "הכל בפרו, ועוד:",
      "תוכנית קומה 3D",
      "קבלת פנים דיגיטלית",
      "RSVP טלפוני (200 שיחות)",
      "תמיכת WhatsApp + טלפון",
    ],
    cta: "בחרו פרימיום",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Event<span className="text-primary">Pro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/calculator"
              className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:block"
            >
              מחשבון חיסכון
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              התחברות
            </Link>
            <Button asChild size="sm">
              <Link href="/register">הרשמה חינם</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            ניהול אירועים מבוסס AI
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-tight">
            האירוע שלכם.{" "}
            <span className="text-gradient-brand">בלי הבזבוז.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            EventPro מסדר הושבה חכמה ב-30 שניות, חוסך אלפי שקלים
            על מושבים ריקים, ומנהל את כל המוזמנים במקום אחד.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/register">
                התחילו בחינם
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8">
              <Link href="/calculator">מחשבון מושבים ריקים</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-b bg-white/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">₪7,000</div>
              <div className="text-xs text-muted-foreground">
                חיסכון ממוצע
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <div className="text-2xl font-bold text-primary">30 שניות</div>
              <div className="text-xs text-muted-foreground">
                הושבה חכמה
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground">
                דיגיטלי
              </div>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div>
              <div className="text-2xl font-bold text-primary">62%</div>
              <div className="text-xs text-muted-foreground">
                חיסכון מול iPlan
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dead Seat Teaser */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-l from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-white text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,oklch(0.45_0.16_350/0.15),transparent)] pointer-events-none" />
            <div className="relative">
              <TrendingDown className="h-10 w-10 mx-auto mb-4 text-amber-400" />
              <h2 className="text-3xl md:text-4xl font-black">
                כמה כסף אתם מבזבזים על מושבים ריקים?
              </h2>
              <p className="text-gray-300 text-lg max-w-xl mx-auto">
                בממוצע, כל חתונה בישראל מבזבזת ₪5,000–₪15,000 על מנות
                שאף אחד לא יאכל.
              </p>
              <Button asChild size="lg" className="mt-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold">
                <Link href="/calculator">
                  גלו עכשיו — חינם
                  <ArrowLeft className="mr-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black">
              הכל במקום אחד
            </h2>
            <p className="text-muted-foreground text-lg mt-3">
              מניהול מוזמנים, דרך הושבה חכמה, ועד קבלת פנים
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-card rounded-xl border p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black">
              תמחור פשוט, ללא הפתעות
            </h2>
            <p className="text-muted-foreground text-lg mt-3">
              62% חיסכון מול iPlan — עם יותר פיצ׳רים
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl border p-6 relative ${
                  tier.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 bg-card scale-105"
                    : "bg-card"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    הכי פופולרי
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-black">{tier.price}</span>
                    {tier.price !== "₪0" && (
                      <span className="text-muted-foreground text-sm">
                        {" "}
                        / לאירוע
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                >
                  <Link href="/register">{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-cta rounded-2xl p-10 md:p-14 text-white text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black">
            מוכנים לחסוך אלפי שקלים?
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            הצטרפו ל-EventPro והתחילו לנהל את האירוע שלכם בצורה
            חכמה, יעילה ומשתלמת.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-primary font-bold text-base px-10"
          >
            <Link href="/register">
              הרשמה חינם
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <Link href="/" className="text-xl font-bold">
                Event<span className="text-primary">Pro</span>
              </Link>
              <p className="text-sm text-muted-foreground mt-1">
                ניהול אירועים חכם מבוסס AI
              </p>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link
                href="/calculator"
                className="hover:text-foreground transition-colors"
              >
                מחשבון חיסכון
              </Link>
              <Link
                href="/login"
                className="hover:text-foreground transition-colors"
              >
                התחברות
              </Link>
              <Link
                href="/register"
                className="hover:text-foreground transition-colors"
              >
                הרשמה
              </Link>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} EventPro. כל הזכויות שמורות.
          </div>
        </div>
      </footer>
    </div>
  );
}
