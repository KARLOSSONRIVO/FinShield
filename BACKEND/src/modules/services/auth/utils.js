/**
 * Parse duration string (e.g., "7d", "1h", "30m") to milliseconds
 */
export function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // Default 1 hour
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}
