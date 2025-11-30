// Utility function to format relative time
export function formatRelativeTime(date: string | Date | null | undefined): string {
    if (!date) return "";

    const now = new Date();
    const messageDate = new Date(date);
    const diffMs = now.getTime() - messageDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Less than 1 minute
    if (diffSeconds < 60) {
        return "Just now";
    }

    // Less than 1 hour
    if (diffMinutes < 60) {
        return diffMinutes === 1 ? "1 min ago" : `${diffMinutes} mins ago`;
    }

    // Less than 24 hours
    if (diffHours < 24) {
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }

    // Less than 2 days
    if (diffDays < 2) {
        return diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
    }

    // More than 2 days - show date
    return messageDate.toLocaleDateString();
}
