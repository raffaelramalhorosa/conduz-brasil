/**
 * Format time string to HH:mm (removes seconds if present)
 * @param time - Time string in HH:mm:ss or HH:mm format
 * @returns Time formatted as HH:mm
 */
export function formatTimeHHMM(time: string): string {
  if (!time) return '';
  // Handle both HH:mm:ss and HH:mm formats
  return time.slice(0, 5);
}

/**
 * Format time range to HH:mm - HH:mm
 * @param startTime - Start time string
 * @param endTime - End time string
 * @returns Formatted time range
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeHHMM(startTime)} - ${formatTimeHHMM(endTime)}`;
}
