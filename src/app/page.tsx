import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">
          Event<span className="text-primary">Pro</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          ניהול אירועים חכם — הושבה אוטומטית, ניהול מוזמנים, וחיסכון כספי
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/register">הרשמה חינם</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">התחברות</Link>
        </Button>
      </div>
    </div>
  );
}
