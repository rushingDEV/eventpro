import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeLayout, generateLayout } from "@/lib/designer/ai-layout";
import { analyzeFlow } from "@/lib/designer/flow-analyzer";
import type { DesignerElement } from "@/lib/designer/types";

// POST — analyze current layout OR generate new layout
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const event = await prisma.event.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      _count: { select: { guests: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { action, elements, canvasWidth, canvasHeight, options } = body as {
    action: "analyze" | "generate";
    elements?: DesignerElement[];
    canvasWidth: number;
    canvasHeight: number;
    options?: {
      tableCapacity?: number;
      includeChuppah?: boolean;
      includeBar?: boolean;
      includeDjBooth?: boolean;
      includePhotosBooth?: boolean;
      layoutStyle?: "arcs" | "grid" | "mixed";
    };
  };

  const guestCount = event._count.guests || 100;

  if (action === "generate") {
    const newElements = generateLayout({
      venueWidth: canvasWidth || 1200,
      venueHeight: canvasHeight || 800,
      guestCount,
      tableCapacity: options?.tableCapacity || 10,
      includeChuppah: options?.includeChuppah ?? true,
      includeBar: options?.includeBar ?? true,
      includeDjBooth: options?.includeDjBooth ?? true,
      includePhotosBooth: options?.includePhotosBooth ?? false,
      layoutStyle: options?.layoutStyle || "arcs",
    });

    return NextResponse.json({ elements: newElements });
  }

  // Default: analyze
  if (!elements || elements.length === 0) {
    return NextResponse.json({ suggestions: [], flow: { score: 0, paths: [], bottlenecks: [] } });
  }

  const suggestions = analyzeLayout(elements, guestCount, canvasWidth || 1200, canvasHeight || 800);
  const flow = analyzeFlow(elements, canvasWidth || 1200, canvasHeight || 800);

  return NextResponse.json({
    suggestions,
    flow: {
      score: flow.score,
      paths: flow.paths,
      bottlenecks: flow.bottlenecks,
    },
  });
}
