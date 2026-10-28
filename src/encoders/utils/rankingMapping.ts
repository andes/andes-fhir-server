/**
 * Mapea ANDES ranking base 1 a FHIR rank base 1
 */
export function mapAndesRankingToFhirRank(andesRanking?: number): number {
    return typeof andesRanking === 'number' && Number.isInteger(andesRanking) && andesRanking >= 0
        ? andesRanking + 1
        : 1;
}

/**
 * Mapea FHIR rank base 1 a ANDES ranking base 0
 */
export function mapFhirRankToAndesRanking(fhirRank?: number): number {
    return typeof fhirRank === 'number' && Number.isInteger(fhirRank) && fhirRank > 0
        ? fhirRank - 1
        : 0;
}
