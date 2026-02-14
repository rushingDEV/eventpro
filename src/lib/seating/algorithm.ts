import type {
  SeatingConstraints,
  SeatingResult,
  SeatingGuest,
  SeatingTable,
  SeatingWarning,
  SeatingSuggestion,
} from "./types";
import { buildProximityMatrix, getProximityScore } from "./proximity-matrix";

const POPULATION_SIZE = 50;
const GENERATIONS = 100;
const MUTATION_RATE = 0.15;
const ELITE_COUNT = 5;

// Fitness function weights
const WEIGHTS = {
  proximity: 0.4,
  balance: 0.2,
  sideBalance: 0.15,
  vipPlacement: 0.1,
  dietary: 0.05,
  accessibility: 0.05,
  noConflict: 0.05,
};

type Assignment = Map<string, string>; // guestId -> tableId

export function runSeatingAlgorithm(
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints,
  groupProximities: Map<string, Record<string, number>>,
  pricePerPlate: number = 0
): SeatingResult {
  // Filter only confirmed guests
  const confirmedGuests = guests.filter(
    (g) => g.rsvpStatus === "CONFIRMED" || g.rsvpStatus === "PENDING"
  );

  if (confirmedGuests.length === 0 || tables.length === 0) {
    return emptyResult(tables);
  }

  // Build proximity matrix
  const proximityMatrix = buildProximityMatrix(
    confirmedGuests,
    groupProximities,
    constraints.separateList,
    constraints.togetherList
  );

  // Generate initial population
  let population = generateInitialPopulation(
    confirmedGuests,
    tables,
    constraints,
    proximityMatrix
  );

  // Run genetic algorithm
  for (let gen = 0; gen < GENERATIONS; gen++) {
    // Evaluate fitness
    const scored = population.map((assignment) => ({
      assignment,
      fitness: evaluateFitness(
        assignment,
        confirmedGuests,
        tables,
        constraints,
        proximityMatrix
      ),
    }));

    // Sort by fitness (descending)
    scored.sort((a, b) => b.fitness - a.fitness);

    // Early exit if score is very high
    if (scored[0].fitness > 95) break;

    // Create next generation
    const nextGen: Assignment[] = [];

    // Keep elites
    for (let i = 0; i < ELITE_COUNT && i < scored.length; i++) {
      nextGen.push(scored[i].assignment);
    }

    // Crossover and mutation
    while (nextGen.length < POPULATION_SIZE) {
      const parentA = tournamentSelect(scored);
      const parentB = tournamentSelect(scored);
      let child = crossover(parentA, parentB, confirmedGuests, tables);

      if (Math.random() < MUTATION_RATE) {
        child = mutate(child, confirmedGuests, tables, constraints);
      }

      nextGen.push(child);
    }

    population = nextGen;
  }

  // Get best solution
  const finalScored = population.map((assignment) => ({
    assignment,
    fitness: evaluateFitness(
      assignment,
      confirmedGuests,
      tables,
      constraints,
      proximityMatrix
    ),
  }));
  finalScored.sort((a, b) => b.fitness - a.fitness);

  const bestAssignment = finalScored[0].assignment;
  const bestScore = finalScored[0].fitness;

  // Apply simulated annealing for local optimization
  const optimized = simulatedAnnealing(
    bestAssignment,
    confirmedGuests,
    tables,
    constraints,
    proximityMatrix
  );

  // Generate warnings and suggestions
  const warnings = generateWarnings(optimized, confirmedGuests, tables, constraints);
  const suggestions = generateSuggestions(
    optimized,
    confirmedGuests,
    tables,
    pricePerPlate
  );

  // Calculate table scores
  const tableScores = new Map<string, number>();
  for (const table of tables) {
    const tableGuests = confirmedGuests.filter(
      (g) => optimized.get(g.id) === table.id
    );
    tableScores.set(
      table.id,
      tableGuests.length > 0
        ? Math.round((tableGuests.length / table.capacity) * 100)
        : 0
    );
  }

  // Calculate stats
  let totalSeated = 0;
  for (const guest of confirmedGuests) {
    if (optimized.has(guest.id)) totalSeated++;
  }
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const emptySeats = totalCapacity - totalSeated;

  return {
    assignments: optimized,
    score: Math.round(bestScore),
    tableScores,
    warnings,
    suggestions,
    stats: {
      totalSeated,
      totalCapacity,
      fillRate: totalCapacity > 0 ? Math.round((totalSeated / totalCapacity) * 100) : 0,
      emptySeats,
      estimatedWaste: emptySeats * pricePerPlate,
    },
  };
}

function emptyResult(tables: SeatingTable[]): SeatingResult {
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  return {
    assignments: new Map(),
    score: 0,
    tableScores: new Map(tables.map((t) => [t.id, 0])),
    warnings: [],
    suggestions: [],
    stats: {
      totalSeated: 0,
      totalCapacity,
      fillRate: 0,
      emptySeats: totalCapacity,
      estimatedWaste: 0,
    },
  };
}

function generateInitialPopulation(
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints,
  proximityMatrix: Map<string, Map<string, number>>
): Assignment[] {
  const population: Assignment[] = [];

  for (let i = 0; i < POPULATION_SIZE; i++) {
    const assignment = new Map<string, string>();

    // Apply locked assignments first
    for (const [guestId, tableId] of constraints.lockedAssignments) {
      assignment.set(guestId, tableId);
    }

    // Group guests by their groupId
    const groupedGuests = new Map<string, SeatingGuest[]>();
    const ungrouped: SeatingGuest[] = [];

    for (const guest of guests) {
      if (assignment.has(guest.id)) continue; // skip locked
      if (guest.groupId) {
        if (!groupedGuests.has(guest.groupId)) {
          groupedGuests.set(guest.groupId, []);
        }
        groupedGuests.get(guest.groupId)!.push(guest);
      } else {
        ungrouped.push(guest);
      }
    }

    // Track table capacity
    const tableOccupancy = new Map<string, number>();
    for (const table of tables) {
      const locked = [...assignment.values()].filter((t) => t === table.id).length;
      tableOccupancy.set(table.id, locked);
    }

    // Assign groups to tables (try to keep groups together)
    const shuffledGroups = [...groupedGuests.entries()].sort(
      () => Math.random() - 0.5
    );

    for (const [, groupGuests] of shuffledGroups) {
      // Find a table with enough room for the group
      const availableTables = tables
        .filter((t) => !t.isLocked || constraints.lockedAssignments.size > 0)
        .filter((t) => {
          const occ = tableOccupancy.get(t.id) || 0;
          return t.capacity - occ >= groupGuests.length;
        })
        .sort(() => Math.random() - 0.5);

      if (availableTables.length > 0) {
        const table = availableTables[0];
        for (const guest of groupGuests) {
          assignment.set(guest.id, table.id);
          tableOccupancy.set(table.id, (tableOccupancy.get(table.id) || 0) + 1);
        }
      } else {
        // Split group across tables
        for (const guest of groupGuests) {
          const table = findBestAvailableTable(tables, tableOccupancy);
          if (table) {
            assignment.set(guest.id, table.id);
            tableOccupancy.set(table.id, (tableOccupancy.get(table.id) || 0) + 1);
          }
        }
      }
    }

    // Assign ungrouped guests
    const shuffledUngrouped = [...ungrouped].sort(() => Math.random() - 0.5);
    for (const guest of shuffledUngrouped) {
      const table = findBestAvailableTable(tables, tableOccupancy);
      if (table) {
        assignment.set(guest.id, table.id);
        tableOccupancy.set(table.id, (tableOccupancy.get(table.id) || 0) + 1);
      }
    }

    population.push(assignment);
  }

  return population;
}

function findBestAvailableTable(
  tables: SeatingTable[],
  occupancy: Map<string, number>
): SeatingTable | null {
  const available = tables.filter((t) => {
    const occ = occupancy.get(t.id) || 0;
    return occ < t.capacity;
  });

  if (available.length === 0) return null;

  // Prefer tables with more free seats
  available.sort((a, b) => {
    const freeA = a.capacity - (occupancy.get(a.id) || 0);
    const freeB = b.capacity - (occupancy.get(b.id) || 0);
    return freeB - freeA;
  });

  return available[0];
}

function evaluateFitness(
  assignment: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints,
  proximityMatrix: Map<string, Map<string, number>>
): number {
  let proximityScore = 0;
  let maxProximity = 0;
  let balanceScore = 0;
  let sideScore = 0;
  let vipScore = 0;
  let dietaryScore = 0;
  let conflictScore = 100; // Start at 100, deduct for conflicts

  // Group guests by table
  const tableGuests = new Map<string, SeatingGuest[]>();
  for (const table of tables) {
    tableGuests.set(table.id, []);
  }
  for (const guest of guests) {
    const tableId = assignment.get(guest.id);
    if (tableId && tableGuests.has(tableId)) {
      tableGuests.get(tableId)!.push(guest);
    }
  }

  // Proximity score: how well-matched are guests at each table
  for (const [, tGuests] of tableGuests) {
    for (let i = 0; i < tGuests.length; i++) {
      for (let j = i + 1; j < tGuests.length; j++) {
        const score = getProximityScore(
          proximityMatrix,
          tGuests[i].id,
          tGuests[j].id
        );
        proximityScore += Math.max(0, score);
        maxProximity += 10;

        // Check conflicts
        if (score < 0) {
          conflictScore -= 20;
        }
      }
    }
  }

  // Balance score: how evenly filled are tables
  for (const table of tables) {
    const tGuests = tableGuests.get(table.id) || [];
    const fillRate = tGuests.length / table.capacity;
    if (tGuests.length > 0) {
      balanceScore += fillRate >= 0.7 ? 100 : fillRate * 142;
    }
  }
  const usedTables = tables.filter(
    (t) => (tableGuests.get(t.id) || []).length > 0
  );
  balanceScore = usedTables.length > 0 ? balanceScore / usedTables.length : 0;

  // Side balance score
  for (const [, tGuests] of tableGuests) {
    if (tGuests.length === 0) continue;
    const groomCount = tGuests.filter((g) => g.side === "GROOM").length;
    const brideCount = tGuests.filter((g) => g.side === "BRIDE").length;
    const total = groomCount + brideCount;
    if (total > 0) {
      const balance = 1 - Math.abs(groomCount - brideCount) / total;
      sideScore += balance * 100;
    } else {
      sideScore += 100;
    }
  }
  sideScore = usedTables.length > 0 ? sideScore / usedTables.length : 0;

  // VIP placement
  const vipGuests = guests.filter((g) => g.vipLevel > 0);
  if (vipGuests.length > 0) {
    let vipCorrect = 0;
    for (const guest of vipGuests) {
      const tableId = assignment.get(guest.id);
      if (tableId) {
        const table = tables.find((t) => t.id === tableId);
        if (table?.isVIP) vipCorrect++;
      }
    }
    vipScore = (vipCorrect / vipGuests.length) * 100;
  } else {
    vipScore = 100;
  }

  // Dietary clustering
  for (const [, tGuests] of tableGuests) {
    if (tGuests.length === 0) continue;
    const withDietary = tGuests.filter((g) => g.dietaryNeeds);
    if (withDietary.length > 1) {
      // Same dietary = good
      const sameCount = withDietary.filter(
        (g) => g.dietaryNeeds === withDietary[0].dietaryNeeds
      ).length;
      dietaryScore += (sameCount / withDietary.length) * 100;
    } else {
      dietaryScore += 100;
    }
  }
  dietaryScore = usedTables.length > 0 ? dietaryScore / usedTables.length : 0;

  // Normalized proximity score
  const normalizedProximity =
    maxProximity > 0 ? (proximityScore / maxProximity) * 100 : 50;

  // Weighted total
  const total =
    normalizedProximity * WEIGHTS.proximity +
    balanceScore * WEIGHTS.balance +
    sideScore * WEIGHTS.sideBalance +
    vipScore * WEIGHTS.vipPlacement +
    dietaryScore * WEIGHTS.dietary +
    Math.max(0, conflictScore) * WEIGHTS.noConflict;

  return total;
}

function tournamentSelect(
  scored: { assignment: Assignment; fitness: number }[]
): Assignment {
  const size = 3;
  let best = scored[Math.floor(Math.random() * scored.length)];
  for (let i = 1; i < size; i++) {
    const candidate = scored[Math.floor(Math.random() * scored.length)];
    if (candidate.fitness > best.fitness) {
      best = candidate;
    }
  }
  return best.assignment;
}

function crossover(
  parentA: Assignment,
  parentB: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[]
): Assignment {
  const child = new Map<string, string>();
  const tableOccupancy = new Map<string, number>();
  for (const table of tables) {
    tableOccupancy.set(table.id, 0);
  }

  for (const guest of guests) {
    // 50% chance from each parent
    const source = Math.random() < 0.5 ? parentA : parentB;
    const tableId = source.get(guest.id);

    if (tableId) {
      const occ = tableOccupancy.get(tableId) || 0;
      const table = tables.find((t) => t.id === tableId);
      if (table && occ < table.capacity) {
        child.set(guest.id, tableId);
        tableOccupancy.set(tableId, occ + 1);
        continue;
      }
    }

    // Fallback: find available table
    const available = findBestAvailableTable(tables, tableOccupancy);
    if (available) {
      child.set(guest.id, available.id);
      tableOccupancy.set(
        available.id,
        (tableOccupancy.get(available.id) || 0) + 1
      );
    }
  }

  return child;
}

function mutate(
  assignment: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints
): Assignment {
  const mutated = new Map(assignment);

  // Swap two random guests between tables
  const unlockedGuests = guests.filter(
    (g) => !constraints.lockedAssignments.has(g.id) && mutated.has(g.id)
  );

  if (unlockedGuests.length < 2) return mutated;

  const idxA = Math.floor(Math.random() * unlockedGuests.length);
  let idxB = Math.floor(Math.random() * unlockedGuests.length);
  while (idxB === idxA) {
    idxB = Math.floor(Math.random() * unlockedGuests.length);
  }

  const guestA = unlockedGuests[idxA];
  const guestB = unlockedGuests[idxB];
  const tableA = mutated.get(guestA.id)!;
  const tableB = mutated.get(guestB.id)!;

  if (tableA !== tableB) {
    mutated.set(guestA.id, tableB);
    mutated.set(guestB.id, tableA);
  }

  return mutated;
}

function simulatedAnnealing(
  initial: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints,
  proximityMatrix: Map<string, Map<string, number>>
): Assignment {
  let current = new Map(initial);
  let currentScore = evaluateFitness(
    current,
    guests,
    tables,
    constraints,
    proximityMatrix
  );
  let best = new Map(current);
  let bestScore = currentScore;

  let temperature = 100;
  const coolingRate = 0.95;
  const iterations = 200;

  for (let i = 0; i < iterations; i++) {
    const neighbor = mutate(current, guests, tables, constraints);
    const neighborScore = evaluateFitness(
      neighbor,
      guests,
      tables,
      constraints,
      proximityMatrix
    );

    const delta = neighborScore - currentScore;
    if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
      current = neighbor;
      currentScore = neighborScore;

      if (currentScore > bestScore) {
        best = new Map(current);
        bestScore = currentScore;
      }
    }

    temperature *= coolingRate;
  }

  return best;
}

function generateWarnings(
  assignment: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[],
  constraints: SeatingConstraints
): SeatingWarning[] {
  const warnings: SeatingWarning[] = [];

  // Check for unassigned guests
  const unassigned = guests.filter((g) => !assignment.has(g.id));
  if (unassigned.length > 0) {
    warnings.push({
      type: "UNASSIGNED",
      severity: "high",
      message: `${unassigned.length} מוזמנים לא הושבו`,
      affectedGuests: unassigned.map((g) => g.id),
    });
  }

  // Check table fill rates
  for (const table of tables) {
    const seated = guests.filter((g) => assignment.get(g.id) === table.id);
    if (seated.length > 0 && seated.length < table.capacity * 0.7) {
      warnings.push({
        type: "EMPTY_SEATS",
        severity: seated.length < table.capacity * 0.5 ? "high" : "medium",
        message: `שולחן ${table.number}: רק ${seated.length} מתוך ${table.capacity} מקומות תפוסים`,
        affectedTable: table.id,
      });
    }
  }

  // Check split groups
  const groupTables = new Map<string, Set<string>>();
  for (const guest of guests) {
    if (!guest.groupId) continue;
    const tableId = assignment.get(guest.id);
    if (!tableId) continue;
    if (!groupTables.has(guest.groupId)) {
      groupTables.set(guest.groupId, new Set());
    }
    groupTables.get(guest.groupId)!.add(tableId);
  }
  for (const [, tableSet] of groupTables) {
    if (tableSet.size > 1 && constraints.respectGroupIntegrity) {
      warnings.push({
        type: "SPLIT_GROUP",
        severity: "medium",
        message: `קבוצה פוצלה ל-${tableSet.size} שולחנות`,
      });
    }
  }

  return warnings;
}

function generateSuggestions(
  assignment: Assignment,
  guests: SeatingGuest[],
  tables: SeatingTable[],
  pricePerPlate: number
): SeatingSuggestion[] {
  const suggestions: SeatingSuggestion[] = [];

  // Find underfilled tables that could be merged
  const tableOccupancy = new Map<string, number>();
  for (const table of tables) {
    const count = guests.filter(
      (g) => assignment.get(g.id) === table.id
    ).length;
    tableOccupancy.set(table.id, count);
  }

  const underfilledTables = tables
    .filter((t) => {
      const occ = tableOccupancy.get(t.id) || 0;
      return occ > 0 && occ < t.capacity * 0.7;
    })
    .sort((a, b) => (tableOccupancy.get(a.id) || 0) - (tableOccupancy.get(b.id) || 0));

  // Suggest merging pairs of underfilled tables
  for (let i = 0; i < underfilledTables.length - 1; i += 2) {
    const tableA = underfilledTables[i];
    const tableB = underfilledTables[i + 1];
    const occA = tableOccupancy.get(tableA.id) || 0;
    const occB = tableOccupancy.get(tableB.id) || 0;
    const combined = occA + occB;
    const targetCapacity = Math.max(tableA.capacity, tableB.capacity);

    if (combined <= targetCapacity) {
      const emptySeatsFreed =
        tableA.capacity + tableB.capacity - targetCapacity;
      const savings = emptySeatsFreed * pricePerPlate;
      suggestions.push({
        type: "MERGE_TABLES",
        message: `מזג שולחן ${tableA.number} (${occA} אורחים) עם שולחן ${tableB.number} (${occB} אורחים)`,
        impact:
          pricePerPlate > 0
            ? `חיסכון של ₪${savings.toLocaleString()}`
            : `${emptySeatsFreed} מקומות ריקים פחות`,
        tableIds: [tableA.id, tableB.id],
      });
    }
  }

  // Suggest removing empty tables
  const emptyTables = tables.filter(
    (t) => (tableOccupancy.get(t.id) || 0) === 0
  );
  for (const table of emptyTables) {
    suggestions.push({
      type: "REMOVE_TABLE",
      message: `הסר שולחן ${table.number} (ריק)`,
      impact:
        pricePerPlate > 0
          ? `חיסכון של ₪${(table.capacity * pricePerPlate).toLocaleString()}`
          : `${table.capacity} מקומות ריקים פחות`,
      tableIds: [table.id],
    });
  }

  return suggestions;
}
