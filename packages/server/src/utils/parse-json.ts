/** Safely parses a JSON column value or returns the fallback. */
function parseJsonColumn<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return (value as T) ?? fallback;
}

export function parsePet(pet: Record<string, unknown>) {
  return {
    ...pet,
    healthRecords: parseJsonColumn<string[]>(pet.healthRecords, []),
    photoUrls: parseJsonColumn<string[]>(pet.photoUrls, []),
  };
}

export function parseMatch(match: Record<string, unknown>) {
  return {
    ...match,
    warnings: parseJsonColumn<string[]>(match.warnings, []),
    breedingTips: parseJsonColumn<string[]>(match.breedingTips, []),
    // Normalize DB column name (requestedBy) to the field name clients expect
    requesterId: (match.requestedBy ?? match.requesterId) as string | undefined,
  };
}

export function parseDiagnostic(diag: Record<string, unknown>) {
  return {
    ...diag,
    possibleConditions: parseJsonColumn<string[]>(diag.possibleConditions, []),
    recommendedActions: parseJsonColumn<string[]>(diag.recommendedActions, []),
  };
}
