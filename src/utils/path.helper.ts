import path = require("path");

export function resolveService(servicePath: string): string {
    return path.resolve(__dirname, '../services', servicePath);
}