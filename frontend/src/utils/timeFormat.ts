// Utility function to format relative time
export function formatRelativeTime(date: string | Date | null | undefined): string {
    return formatDateTime(date);
}
// Utility function to format date and time
export function formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return "";

    const messageDate = new Date(date);

    return messageDate.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
