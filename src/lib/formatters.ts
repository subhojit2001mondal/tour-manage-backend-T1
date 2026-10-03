/**
 * Formats a number to Indian Rupee (INR) currency format (e.g. ₹1,25,000)
 */
export function formatINR(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats date into Indian Standard Time (IST) display format
 */
export function formatIST(dateStringOrTimestamp: string | number | Date | undefined | null, includeTime: boolean = false): string {
  if (!dateStringOrTimestamp) return '-';
  try {
    const d = new Date(dateStringOrTimestamp);
    if (isNaN(d.getTime())) return String(dateStringOrTimestamp);

    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
    };

    const formatted = new Intl.DateTimeFormat('en-IN', options).format(d);
    return includeTime ? `${formatted} IST` : formatted;
  } catch {
    return String(dateStringOrTimestamp);
  }
}

/**
 * Returns relative time string like "5m ago", "2h ago", "Yesterday"
 */
export function formatRelativeTime(dateStringOrTimestamp: string | number | Date | undefined | null): string {
  if (!dateStringOrTimestamp) return '';
  try {
    const date = new Date(dateStringOrTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatIST(date, false);
  } catch {
    return '';
  }
}
