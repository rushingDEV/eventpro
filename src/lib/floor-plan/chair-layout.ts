/**
 * Chair layout calculator — positions chairs around tables based on shape and capacity.
 */

export interface ChairPosition {
  x: number;
  y: number;
  angle: number; // rotation so chair faces the table center
}

/**
 * Compute chair positions around a round table.
 */
export function getChairsForRound(
  capacity: number,
  radius: number
): ChairPosition[] {
  const chairs: ChairPosition[] = [];
  const chairRadius = radius + 18; // chairs sit just outside the table edge
  for (let i = 0; i < capacity; i++) {
    const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
    chairs.push({
      x: Math.cos(angle) * chairRadius,
      y: Math.sin(angle) * chairRadius,
      angle: (angle * 180) / Math.PI + 90,
    });
  }
  return chairs;
}

/**
 * Compute chair positions around a rectangular table.
 * Distributes chairs evenly along the two long sides, with 1 on each short side if capacity allows.
 */
export function getChairsForRect(
  capacity: number,
  width: number,
  height: number
): ChairPosition[] {
  const chairs: ChairPosition[] = [];
  const offset = 18;

  // For small capacity, just split between top and bottom
  if (capacity <= 4) {
    const perSide = Math.ceil(capacity / 2);
    const bottomCount = Math.min(perSide, capacity);
    const topCount = capacity - bottomCount;

    for (let i = 0; i < bottomCount; i++) {
      const x = -width / 2 + (width / (bottomCount + 1)) * (i + 1);
      chairs.push({ x, y: height / 2 + offset, angle: 0 });
    }
    for (let i = 0; i < topCount; i++) {
      const x = -width / 2 + (width / (topCount + 1)) * (i + 1);
      chairs.push({ x, y: -height / 2 - offset, angle: 180 });
    }
    return chairs;
  }

  // Use head/foot seats for capacity > 6
  const useHeads = capacity > 6;
  const remaining = useHeads ? capacity - 2 : capacity;
  const perLongSide = Math.ceil(remaining / 2);
  const bottomCount = perLongSide;
  const topCount = remaining - perLongSide;

  // Bottom side (facing up)
  for (let i = 0; i < bottomCount; i++) {
    const x = -width / 2 + (width / (bottomCount + 1)) * (i + 1);
    chairs.push({ x, y: height / 2 + offset, angle: 0 });
  }

  // Top side (facing down)
  for (let i = 0; i < topCount; i++) {
    const x = -width / 2 + (width / (topCount + 1)) * (i + 1);
    chairs.push({ x, y: -height / 2 - offset, angle: 180 });
  }

  // Head seats
  if (useHeads) {
    chairs.push({ x: width / 2 + offset, y: 0, angle: 270 }); // right head
    chairs.push({ x: -width / 2 - offset, y: 0, angle: 90 }); // left head
  }

  return chairs;
}

/**
 * Get chair positions for any table shape.
 */
export function getChairPositions(
  shape: string,
  capacity: number,
  tableRadius?: number | null,
  tableWidth?: number | null,
  tableHeight?: number | null
): ChairPosition[] {
  switch (shape) {
    case "ROUND":
    case "OVAL":
      return getChairsForRound(capacity, tableRadius || 50);
    case "RECTANGLE":
    case "SQUARE":
      return getChairsForRect(
        capacity,
        tableWidth || 120,
        tableHeight || 60
      );
    case "LONG":
      return getChairsForRect(
        capacity,
        tableWidth || 200,
        tableHeight || 50
      );
    default:
      return getChairsForRound(capacity, tableRadius || 50);
  }
}
