"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingDown, Users, UtensilsCrossed, Percent, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export function CalculatorForm() {
  const [guests, setGuests] = useState(250);
  const [pricePerPlate, setPricePerPlate] = useState(350);
  const [noShowRate, setNoShowRate] = useState(12);

  const result = useMemo(() => {
    const seatsPerTable = 10;
    const expectedNoShows = Math.round(guests * (noShowRate / 100));
    const tablesNeeded = Math.ceil(guests / seatsPerTable);
    const totalCapacity = tablesNeeded * seatsPerTable;
    const emptyFromRounding = totalCapacity - guests;
    const totalEmptySeats = expectedNoShows + emptyFromRounding;
    const wastedMoney = totalEmptySeats * pricePerPlate;
    const savingsWithEventPro = Math.round(wastedMoney * 0.65);

    return {
      expectedNoShows,
      tablesNeeded,
      totalEmptySeats,
      wastedMoney,
      savingsWithEventPro,
    };
  }, [guests, pricePerPlate, noShowRate]);

  return (
    <div className="space-y-8">
      {/* Sliders */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              מספר מוזמנים
            </Label>
            <span className="text-2xl font-bold text-primary" dir="ltr">
              {guests}
            </span>
          </div>
          <Slider
            value={[guests]}
            onValueChange={([v]) => setGuests(v)}
            min={50}
            max={500}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>50</span>
            <span>500</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              מחיר למנה
            </Label>
            <span className="text-2xl font-bold text-primary" dir="ltr">
              ₪{pricePerPlate}
            </span>
          </div>
          <Slider
            value={[pricePerPlate]}
            onValueChange={([v]) => setPricePerPlate(v)}
            min={200}
            max={600}
            step={10}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>₪200</span>
            <span>₪600</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base">
              <Percent className="h-4 w-4 text-primary" />
              אחוז ביטולים צפוי
            </Label>
            <span className="text-2xl font-bold text-primary" dir="ltr">
              {noShowRate}%
            </span>
          </div>
          <Slider
            value={[noShowRate]}
            onValueChange={([v]) => setNoShowRate(v)}
            min={5}
            max={25}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground" dir="ltr">
            <span>5%</span>
            <span>25%</span>
          </div>
        </div>
      </div>

      {/* Result */}
      <Card className="border-2 border-primary/20 bg-gradient-to-l from-rose-50 to-amber-50 overflow-hidden">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <TrendingDown className="h-5 w-5" />
              <span className="text-lg">אתם עומדים לבזבז</span>
            </div>
            <div
              className="text-6xl md:text-7xl font-black text-gradient-brand"
              dir="ltr"
            >
              ₪{result.wastedMoney.toLocaleString()}
            </div>
            <p className="text-xl text-muted-foreground">על מושבים ריקים</p>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-4">
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-destructive">
                  {result.expectedNoShows}
                </div>
                <div className="text-xs text-muted-foreground">לא יגיעו</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {result.totalEmptySeats}
                </div>
                <div className="text-xs text-muted-foreground">
                  מושבים ריקים
                </div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">
                  {result.tablesNeeded}
                </div>
                <div className="text-xs text-muted-foreground">
                  שולחנות נדרשים
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings CTA */}
      <Card className="bg-gradient-cta text-white border-0">
        <CardContent className="py-8 text-center space-y-4">
          <h3 className="text-2xl font-bold">
            EventPro יכול לחסוך לכם עד
          </h3>
          <div className="text-5xl font-black" dir="ltr">
            ₪{result.savingsWithEventPro.toLocaleString()}
          </div>
          <p className="text-white/80 max-w-md mx-auto">
            באמצעות הושבה חכמה מבוססת AI שממזערת מושבים ריקים ומונעת
            בזבוז
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-primary font-bold"
            >
              <Link href="/register">
                הירשמו בחינם
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
