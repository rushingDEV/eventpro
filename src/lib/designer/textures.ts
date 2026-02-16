/**
 * Texture / material presets for 2.5D mode.
 * Textures are generated as canvas patterns (no external images needed).
 */

export type TextureCategory = "wood" | "fabric" | "stone" | "metal" | "floor";

export interface TexturePreset {
  id: string;
  name: string;
  nameHe: string;
  category: TextureCategory;
  baseColor: string;
  patternColor: string;
  accentColor?: string;
}

export const TEXTURE_PRESETS: TexturePreset[] = [
  // Wood
  { id: "oak", name: "Oak", nameHe: "אלון", category: "wood", baseColor: "#D2A970", patternColor: "#B8904A", accentColor: "#A07B3F" },
  { id: "walnut", name: "Walnut", nameHe: "אגוז", category: "wood", baseColor: "#6D4C41", patternColor: "#5D4037", accentColor: "#4E342E" },
  { id: "mahogany", name: "Mahogany", nameHe: "מהגוני", category: "wood", baseColor: "#8B4513", patternColor: "#723A0F", accentColor: "#5C2E0C" },
  { id: "white-wash", name: "White Wash", nameHe: "לבן מוברש", category: "wood", baseColor: "#E8DDD0", patternColor: "#D4C7B8", accentColor: "#C0B0A0" },

  // Fabric
  { id: "velvet", name: "Velvet", nameHe: "קטיפה", category: "fabric", baseColor: "#800020", patternColor: "#6B001A", accentColor: "#580015" },
  { id: "linen", name: "Linen", nameHe: "פשתן", category: "fabric", baseColor: "#E8DCC8", patternColor: "#D8CCB0", accentColor: "#C8BC9C" },
  { id: "satin", name: "Satin", nameHe: "סאטן", category: "fabric", baseColor: "#F5E6D3", patternColor: "#E8D4BE", accentColor: "#DBCAB0" },

  // Stone
  { id: "marble", name: "Marble", nameHe: "שיש", category: "stone", baseColor: "#F0EDE8", patternColor: "#D8D2C8", accentColor: "#C0B8A8" },
  { id: "granite", name: "Granite", nameHe: "גרניט", category: "stone", baseColor: "#808080", patternColor: "#6B6B6B", accentColor: "#585858" },

  // Metal
  { id: "gold", name: "Gold", nameHe: "זהב", category: "metal", baseColor: "#FFD700", patternColor: "#DAA520", accentColor: "#B8860B" },
  { id: "silver", name: "Silver", nameHe: "כסף", category: "metal", baseColor: "#C0C0C0", patternColor: "#A8A8A8", accentColor: "#909090" },
  { id: "rose-gold", name: "Rose Gold", nameHe: "רוז גולד", category: "metal", baseColor: "#B76E79", patternColor: "#A05A64", accentColor: "#8B4E55" },

  // Floor
  { id: "parquet", name: "Parquet", nameHe: "פרקט", category: "floor", baseColor: "#C8A97E", patternColor: "#B0905C", accentColor: "#987840" },
  { id: "tiles", name: "Tiles", nameHe: "אריחים", category: "floor", baseColor: "#E0D8D0", patternColor: "#C8BEB4", accentColor: "#B0A498" },
  { id: "carpet", name: "Carpet", nameHe: "שטיח", category: "floor", baseColor: "#8B0000", patternColor: "#780000", accentColor: "#660000" },
  { id: "grass", name: "Grass", nameHe: "דשא", category: "floor", baseColor: "#4CAF50", patternColor: "#388E3C", accentColor: "#2E7D32" },
];

// ── Canvas pattern generation ──

const patternCache = new Map<string, HTMLCanvasElement>();

/**
 * Generate a simple procedural texture pattern as an HTML Canvas element.
 * These can be used as Konva fillPatternImage.
 */
export function getTexturePattern(textureId: string, size = 64): HTMLCanvasElement | null {
  if (typeof window === "undefined") return null;

  const cacheKey = `${textureId}_${size}`;
  if (patternCache.has(cacheKey)) return patternCache.get(cacheKey)!;

  const preset = TEXTURE_PRESETS.find((t) => t.id === textureId);
  if (!preset) return null;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base color
  ctx.fillStyle = preset.baseColor;
  ctx.fillRect(0, 0, size, size);

  switch (preset.category) {
    case "wood":
      drawWoodPattern(ctx, size, preset);
      break;
    case "fabric":
      drawFabricPattern(ctx, size, preset);
      break;
    case "stone":
      drawStonePattern(ctx, size, preset);
      break;
    case "metal":
      drawMetalPattern(ctx, size, preset);
      break;
    case "floor":
      drawFloorPattern(ctx, size, preset);
      break;
  }

  patternCache.set(cacheKey, canvas);
  return canvas;
}

function drawWoodPattern(ctx: CanvasRenderingContext2D, size: number, preset: TexturePreset) {
  ctx.strokeStyle = preset.patternColor;
  ctx.lineWidth = 1;
  for (let y = 0; y < size; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(y * 0.3) * 2);
    for (let x = 0; x < size; x += 4) {
      ctx.lineTo(x, y + Math.sin((x + y) * 0.2) * 2);
    }
    ctx.stroke();
  }
  // Knot
  if (preset.accentColor) {
    ctx.fillStyle = preset.accentColor;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(size * 0.7, size * 0.5, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawFabricPattern(ctx: CanvasRenderingContext2D, size: number, preset: TexturePreset) {
  ctx.strokeStyle = preset.patternColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.3;
  for (let y = 0; y < size; y += 3) {
    for (let x = 0; x < size; x += 3) {
      if ((x + y) % 6 === 0) {
        ctx.fillStyle = preset.patternColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawStonePattern(ctx: CanvasRenderingContext2D, size: number, preset: TexturePreset) {
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = i % 2 === 0 ? preset.patternColor : (preset.accentColor || preset.patternColor);
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  // Veins for marble
  if (preset.id === "marble") {
    ctx.strokeStyle = preset.patternColor;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.quadraticCurveTo(size * 0.5, size * 0.2, size, size * 0.6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMetalPattern(ctx: CanvasRenderingContext2D, size: number, preset: TexturePreset) {
  // Brushed metal effect
  ctx.globalAlpha = 0.1;
  for (let y = 0; y < size; y += 2) {
    ctx.strokeStyle = y % 4 === 0 ? preset.patternColor : preset.baseColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  // Highlight
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(255,255,255,0.1)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.2)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 1;
}

function drawFloorPattern(ctx: CanvasRenderingContext2D, size: number, preset: TexturePreset) {
  if (preset.id === "parquet" || preset.id === "tiles") {
    // Grid pattern
    ctx.strokeStyle = preset.patternColor;
    ctx.lineWidth = 1;
    const gridStep = size / 4;
    for (let x = 0; x <= size; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
  } else if (preset.id === "grass") {
    // Random grass blades
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 30; i++) {
      ctx.strokeStyle = i % 2 === 0 ? preset.patternColor : (preset.accentColor || preset.patternColor);
      ctx.lineWidth = 0.5;
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 4);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/**
 * Clear texture cache (for cleanup).
 */
export function clearTextureCache() {
  patternCache.clear();
}
