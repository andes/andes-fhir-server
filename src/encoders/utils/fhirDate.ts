
export function isValidFHIRDateTime(date: any): boolean {
    if (date === null || date === undefined || date === 0 || date === '0' || date === '') {
        return false;
    }
    const d = new Date(date);
    return !isNaN(d.getTime());
}

export function formatFHIRDateTime(date: any): string | undefined {
    if (isValidFHIRDateTime(date)) {
        return new Date(date).toISOString();
    }
    return undefined;
}

export function formatFHIRDate(date: any): string | undefined {
    if (isValidFHIRDateTime(date)) {
        return new Date(date).toISOString().split('T')[0];
    }
    return undefined;
}
