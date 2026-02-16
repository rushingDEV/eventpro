import type { DesignerElement } from "./types";

const GRID_RESOLUTION = 10; // pixels per grid cell

interface FlowPoint {
  x: number;
  y: number;
  label: string;
}

interface FlowResult {
  score: number; // 0-100
  paths: { from: string; to: string; distance: number; blocked: boolean }[];
  bottlenecks: { x: number; y: number; severity: "low" | "medium" | "high" }[];
  heatmap: number[][]; // 2D array of traffic density
}

/**
 * Analyze flow between key points in the venue layout.
 * Uses a simple grid-based pathfinding approach.
 */
export function analyzeFlow(
  elements: DesignerElement[],
  canvasWidth: number,
  canvasHeight: number,
): FlowResult {
  const gridW = Math.ceil(canvasWidth / GRID_RESOLUTION);
  const gridH = Math.ceil(canvasHeight / GRID_RESOLUTION);

  // Build occupancy grid
  const grid: boolean[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => false),
  );

  // Mark occupied cells
  for (const el of elements) {
    if (!el.visible) continue;
    // Skip non-solid elements
    if (["lighting", "sign", "flower-arrangement"].includes(el.type)) continue;

    const left = Math.floor((el.x - el.width / 2) / GRID_RESOLUTION);
    const right = Math.ceil((el.x + el.width / 2) / GRID_RESOLUTION);
    const top = Math.floor((el.y - el.height / 2) / GRID_RESOLUTION);
    const bottom = Math.ceil((el.y + el.height / 2) / GRID_RESOLUTION);

    for (let row = Math.max(0, top); row < Math.min(gridH, bottom); row++) {
      for (let col = Math.max(0, left); col < Math.min(gridW, right); col++) {
        grid[row][col] = true;
      }
    }
  }

  // Identify key points
  const keyPoints: FlowPoint[] = [];
  for (const el of elements) {
    if (el.type === "entrance" || el.type === "exit") {
      keyPoints.push({ x: el.x, y: el.y, label: el.name });
    }
    if (el.type === "bar" || el.type === "buffet") {
      keyPoints.push({ x: el.x, y: el.y, label: el.name });
    }
    if (el.type === "dance-floor") {
      keyPoints.push({ x: el.x, y: el.y, label: el.name });
    }
    if (el.type === "stage" || el.type === "chuppah") {
      keyPoints.push({ x: el.x, y: el.y, label: el.name });
    }
  }

  // BFS pathfinding between key points
  const paths: FlowResult["paths"] = [];
  const heatmap: number[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => 0),
  );

  for (let i = 0; i < keyPoints.length; i++) {
    for (let j = i + 1; j < keyPoints.length; j++) {
      const from = keyPoints[i];
      const to = keyPoints[j];
      const result = bfs(grid, gridW, gridH, from, to);

      paths.push({
        from: from.label,
        to: to.label,
        distance: result.distance,
        blocked: result.blocked,
      });

      // Add path to heatmap
      for (const cell of result.path) {
        if (cell[0] >= 0 && cell[0] < gridH && cell[1] >= 0 && cell[1] < gridW) {
          heatmap[cell[0]][cell[1]]++;
        }
      }
    }
  }

  // Find bottlenecks (high-traffic narrow areas)
  const bottlenecks: FlowResult["bottlenecks"] = [];
  for (let row = 1; row < gridH - 1; row++) {
    for (let col = 1; col < gridW - 1; col++) {
      if (heatmap[row][col] > 3) {
        // Check if it's a narrow passage
        const neighbors = [
          grid[row - 1]?.[col],
          grid[row + 1]?.[col],
          grid[row]?.[col - 1],
          grid[row]?.[col + 1],
        ];
        const blockedSides = neighbors.filter(Boolean).length;

        if (blockedSides >= 2) {
          bottlenecks.push({
            x: col * GRID_RESOLUTION,
            y: row * GRID_RESOLUTION,
            severity: blockedSides >= 3 ? "high" : blockedSides >= 2 ? "medium" : "low",
          });
        }
      }
    }
  }

  // Calculate score
  const blockedPaths = paths.filter((p) => p.blocked).length;
  const totalPaths = paths.length || 1;
  const pathScore = ((totalPaths - blockedPaths) / totalPaths) * 60;
  const bottleneckPenalty = Math.min(40, bottlenecks.filter((b) => b.severity === "high").length * 10);
  const score = Math.max(0, Math.min(100, Math.round(pathScore + 40 - bottleneckPenalty)));

  return { score, paths, bottlenecks, heatmap };
}

function bfs(
  grid: boolean[][],
  gridW: number,
  gridH: number,
  from: FlowPoint,
  to: FlowPoint,
): { distance: number; blocked: boolean; path: [number, number][] } {
  const startRow = Math.floor(from.y / GRID_RESOLUTION);
  const startCol = Math.floor(from.x / GRID_RESOLUTION);
  const endRow = Math.floor(to.y / GRID_RESOLUTION);
  const endCol = Math.floor(to.x / GRID_RESOLUTION);

  if (
    startRow < 0 || startRow >= gridH ||
    startCol < 0 || startCol >= gridW ||
    endRow < 0 || endRow >= gridH ||
    endCol < 0 || endCol >= gridW
  ) {
    return { distance: Infinity, blocked: true, path: [] };
  }

  const visited: boolean[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => false),
  );
  const parent: ([number, number] | null)[][] = Array.from({ length: gridH }, () =>
    Array.from({ length: gridW }, () => null as [number, number] | null),
  );

  const queue: [number, number][] = [[startRow, startCol]];
  visited[startRow][startCol] = true;

  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1], // diagonal
  ];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    if (row === endRow && col === endCol) {
      // Reconstruct path
      const path: [number, number][] = [];
      let curr: [number, number] | null = [endRow, endCol];
      while (curr) {
        path.push(curr);
        curr = parent[curr[0]][curr[1]];
      }
      path.reverse();
      const distance = path.length * GRID_RESOLUTION;
      return { distance, blocked: false, path };
    }

    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < gridH && nc >= 0 && nc < gridW && !visited[nr][nc] && !grid[nr][nc]) {
        visited[nr][nc] = true;
        parent[nr][nc] = [row, col];
        queue.push([nr, nc]);
      }
    }
  }

  return { distance: Infinity, blocked: true, path: [] };
}
