import type { DesignerElement, AlignmentGuide } from "./types";

const SNAP_THRESHOLD = 5;

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

function getBounds(el: DesignerElement): Bounds {
  return {
    left: el.x - el.width / 2,
    right: el.x + el.width / 2,
    top: el.y - el.height / 2,
    bottom: el.y + el.height / 2,
    centerX: el.x,
    centerY: el.y,
  };
}

/**
 * Calculate snap guides while dragging an element.
 * Returns alignment guides + snapped position.
 */
export function getSnapGuides(
  draggedElement: DesignerElement,
  allElements: DesignerElement[],
  snapThreshold = SNAP_THRESHOLD,
): { guides: AlignmentGuide[]; snappedX: number; snappedY: number } {
  const guides: AlignmentGuide[] = [];
  let snappedX = draggedElement.x;
  let snappedY = draggedElement.y;
  const dragged = getBounds(draggedElement);

  const others = allElements.filter(
    (el) => el.id !== draggedElement.id && el.visible && !el.locked,
  );

  let closestDxL = Infinity;
  let closestDxC = Infinity;
  let closestDxR = Infinity;
  let closestDyT = Infinity;
  let closestDyC = Infinity;
  let closestDyB = Infinity;

  for (const other of others) {
    const b = getBounds(other);

    // Vertical guides (X alignment)
    // Left-left
    const dlL = Math.abs(dragged.left - b.left);
    if (dlL < snapThreshold && dlL < closestDxL) {
      closestDxL = dlL;
      snappedX = b.left + draggedElement.width / 2;
      guides.push({ type: "vertical", position: b.left });
    }
    // Right-right
    const drR = Math.abs(dragged.right - b.right);
    if (drR < snapThreshold && drR < closestDxR) {
      closestDxR = drR;
      snappedX = b.right - draggedElement.width / 2;
      guides.push({ type: "vertical", position: b.right });
    }
    // Center-center X
    const dcX = Math.abs(dragged.centerX - b.centerX);
    if (dcX < snapThreshold && dcX < closestDxC) {
      closestDxC = dcX;
      snappedX = b.centerX;
      guides.push({ type: "vertical", position: b.centerX });
    }
    // Left-right
    const dlR = Math.abs(dragged.left - b.right);
    if (dlR < snapThreshold) {
      snappedX = b.right + draggedElement.width / 2;
      guides.push({ type: "vertical", position: b.right });
    }
    // Right-left
    const drL = Math.abs(dragged.right - b.left);
    if (drL < snapThreshold) {
      snappedX = b.left - draggedElement.width / 2;
      guides.push({ type: "vertical", position: b.left });
    }

    // Horizontal guides (Y alignment)
    // Top-top
    const dtT = Math.abs(dragged.top - b.top);
    if (dtT < snapThreshold && dtT < closestDyT) {
      closestDyT = dtT;
      snappedY = b.top + draggedElement.height / 2;
      guides.push({ type: "horizontal", position: b.top });
    }
    // Bottom-bottom
    const dbB = Math.abs(dragged.bottom - b.bottom);
    if (dbB < snapThreshold && dbB < closestDyB) {
      closestDyB = dbB;
      snappedY = b.bottom - draggedElement.height / 2;
      guides.push({ type: "horizontal", position: b.bottom });
    }
    // Center-center Y
    const dcY = Math.abs(dragged.centerY - b.centerY);
    if (dcY < snapThreshold && dcY < closestDyC) {
      closestDyC = dcY;
      snappedY = b.centerY;
      guides.push({ type: "horizontal", position: b.centerY });
    }
  }

  return { guides, snappedX, snappedY };
}

/**
 * Align selected elements to a specific alignment.
 */
export function alignElements(
  elements: DesignerElement[],
  alignment:
    | "left"
    | "right"
    | "centerH"
    | "top"
    | "bottom"
    | "centerV"
    | "distributeH"
    | "distributeV",
): Map<string, { x: number; y: number }> {
  const updates = new Map<string, { x: number; y: number }>();
  if (elements.length < 2) return updates;

  const bounds = elements.map(getBounds);

  switch (alignment) {
    case "left": {
      const minLeft = Math.min(...bounds.map((b) => b.left));
      elements.forEach((el) => {
        updates.set(el.id, { x: minLeft + el.width / 2, y: el.y });
      });
      break;
    }
    case "right": {
      const maxRight = Math.max(...bounds.map((b) => b.right));
      elements.forEach((el) => {
        updates.set(el.id, { x: maxRight - el.width / 2, y: el.y });
      });
      break;
    }
    case "centerH": {
      const avg = bounds.reduce((sum, b) => sum + b.centerX, 0) / bounds.length;
      elements.forEach((el) => {
        updates.set(el.id, { x: avg, y: el.y });
      });
      break;
    }
    case "top": {
      const minTop = Math.min(...bounds.map((b) => b.top));
      elements.forEach((el) => {
        updates.set(el.id, { x: el.x, y: minTop + el.height / 2 });
      });
      break;
    }
    case "bottom": {
      const maxBottom = Math.max(...bounds.map((b) => b.bottom));
      elements.forEach((el) => {
        updates.set(el.id, { x: el.x, y: maxBottom - el.height / 2 });
      });
      break;
    }
    case "centerV": {
      const avg = bounds.reduce((sum, b) => sum + b.centerY, 0) / bounds.length;
      elements.forEach((el) => {
        updates.set(el.id, { x: el.x, y: avg });
      });
      break;
    }
    case "distributeH": {
      const sorted = [...elements].sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const maxX = sorted[sorted.length - 1].x;
      const step = (maxX - minX) / (sorted.length - 1);
      sorted.forEach((el, i) => {
        updates.set(el.id, { x: minX + step * i, y: el.y });
      });
      break;
    }
    case "distributeV": {
      const sorted = [...elements].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const maxY = sorted[sorted.length - 1].y;
      const step = (maxY - minY) / (sorted.length - 1);
      sorted.forEach((el, i) => {
        updates.set(el.id, { x: el.x, y: minY + step * i });
      });
      break;
    }
  }

  return updates;
}

/**
 * Check minimum spacing between elements (fire safety).
 */
export function checkMinSpacing(
  elements: DesignerElement[],
  minSpacingPx = 30, // ~1.2m at standard scale
): { elementId1: string; elementId2: string; distance: number }[] {
  const violations: { elementId1: string; elementId2: string; distance: number }[] = [];

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = (a.width + b.width) / 4 + minSpacingPx;

      if (dist < minDist) {
        violations.push({
          elementId1: a.id,
          elementId2: b.id,
          distance: dist,
        });
      }
    }
  }

  return violations;
}
