import Link from "next/link";

const categoryLinks = [
  { label: "צלמים ווידאו", href: "/marketplace/photographers" },
  { label: "DJ ומוזיקה", href: "/marketplace/music" },
  { label: "עיצוב פרחים", href: "/marketplace/florists" },
  { label: "קייטרינג", href: "/marketplace/catering" },
  { label: "מייקאפ ושיער", href: "/marketplace/beauty" },
  { label: "הפקה", href: "/marketplace/production" },
];

export function MarketplaceFooter() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="text-xl font-bold">
              <span className="text-gradient-brand">Event</span>Pro
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              כל הספקים לאירוע המושלם — במקום אחד
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-bold text-sm mb-3">קטגוריות פופולריות</h3>
            <div className="grid grid-cols-2 gap-2">
              {categoryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-sm mb-3">קישורים</h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/register-vendor"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                הרשמת ספקים
              </Link>
              <Link
                href="/calculator"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                מחשבון חיסכון
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                התחברות
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} EventPro. כל הזכויות שמורות.
        </div>
      </div>
    </footer>
  );
}
