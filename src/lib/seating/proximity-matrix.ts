import type { SeatingGuest } from "./types";

// Proximity scores between groups
const BASE_SCORES = {
  SAME_NUCLEAR_FAMILY: 10,
  SAME_EXTENDED_FAMILY: 8,
  SAME_FRIEND_GROUP: 7,
  SAME_WORKPLACE: 5,
  SAME_ACQUAINTANCE: 3,
  UNKNOWN: 0,
  SHOULD_NOT_SIT: -10,
};

export function buildProximityMatrix(
  guests: SeatingGuest[],
  groupProximities: Map<string, Record<string, number>>,
  separateList: [string, string][],
  togetherList: [string, string][]
): Map<string, Map<string, number>> {
  const matrix = new Map<string, Map<string, number>>();

  for (const guest of guests) {
    matrix.set(guest.id, new Map());
  }

  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      const a = guests[i];
      const b = guests[j];
      let score = 0;

      // Same group = high proximity
      if (a.groupId && b.groupId && a.groupId === b.groupId) {
        score = BASE_SCORES.SAME_FRIEND_GROUP;
      }

      // Group-level proximity from proximity matrix
      if (a.groupId && b.groupId && a.groupId !== b.groupId) {
        const groupProx = groupProximities.get(a.groupId);
        if (groupProx && groupProx[b.groupId] !== undefined) {
          score = Math.max(score, groupProx[b.groupId]);
        }
      }

      // Same side bonus
      if (a.side === b.side && a.side !== "SHARED") {
        score += 1;
      }

      // Personal proximity scores override
      if (a.proximityScores && a.proximityScores[b.id] !== undefined) {
        score = a.proximityScores[b.id];
      }
      if (b.proximityScores && b.proximityScores[a.id] !== undefined) {
        score = Math.max(score, b.proximityScores[a.id]);
      }

      // Similar dietary needs bonus
      if (a.dietaryNeeds && b.dietaryNeeds && a.dietaryNeeds === b.dietaryNeeds) {
        score += 1;
      }

      // Set symmetric scores
      matrix.get(a.id)!.set(b.id, score);
      matrix.get(b.id)!.set(a.id, score);
    }
  }

  // Apply explicit separate/together lists
  for (const [idA, idB] of separateList) {
    if (matrix.has(idA) && matrix.get(idA)!.has(idB)) {
      matrix.get(idA)!.set(idB, BASE_SCORES.SHOULD_NOT_SIT);
      matrix.get(idB)!.set(idA, BASE_SCORES.SHOULD_NOT_SIT);
    }
  }

  for (const [idA, idB] of togetherList) {
    if (matrix.has(idA) && matrix.get(idA)!.has(idB)) {
      matrix.get(idA)!.set(idB, BASE_SCORES.SAME_NUCLEAR_FAMILY);
      matrix.get(idB)!.set(idA, BASE_SCORES.SAME_NUCLEAR_FAMILY);
    }
  }

  return matrix;
}

export function getProximityScore(
  matrix: Map<string, Map<string, number>>,
  guestA: string,
  guestB: string
): number {
  return matrix.get(guestA)?.get(guestB) ?? 0;
}
