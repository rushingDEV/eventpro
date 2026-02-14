export interface SeatingConstraints {
  maxEmptySeatsPerTable: number;
  respectGroupIntegrity: boolean;
  balanceSides: boolean;
  separateList: [string, string][];
  togetherList: [string, string][];
  lockedAssignments: Map<string, string>;
}

export interface SeatingResult {
  assignments: Map<string, string>;
  score: number;
  tableScores: Map<string, number>;
  warnings: SeatingWarning[];
  suggestions: SeatingSuggestion[];
  stats: {
    totalSeated: number;
    totalCapacity: number;
    fillRate: number;
    emptySeats: number;
    estimatedWaste: number;
  };
}

export interface SeatingWarning {
  type: "EMPTY_SEATS" | "SPLIT_GROUP" | "CONFLICT" | "OVERFLOW" | "UNASSIGNED";
  severity: "low" | "medium" | "high";
  message: string;
  affectedGuests?: string[];
  affectedTable?: string;
}

export interface SeatingSuggestion {
  type:
    | "MERGE_TABLES"
    | "ADD_TABLE"
    | "MOVE_GUEST"
    | "FILL_SEATS"
    | "REMOVE_TABLE";
  message: string;
  impact: string;
  tableIds?: string[];
  guestIds?: string[];
}

export interface SeatingGuest {
  id: string;
  firstName: string;
  lastName: string | null;
  groupId: string | null;
  side: string;
  rsvpStatus: string;
  rsvpCount: number;
  vipLevel: number;
  dietaryNeeds: string | null;
  accessibility: string | null;
  tableId: string | null;
  proximityScores: Record<string, number> | null;
}

export interface SeatingTable {
  id: string;
  number: number;
  name: string | null;
  capacity: number;
  isLocked: boolean;
  isVIP: boolean;
  zone: string | null;
  guests: string[];
}
