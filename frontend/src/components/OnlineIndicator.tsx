import { formatRelativeTime } from "../utils/timeFormat";

interface OnlineIndicatorProps {
    isOnline: boolean;
    lastSeen?: string | null;
    showLastSeen?: boolean;
}

export const OnlineIndicator = ({ isOnline, lastSeen, showLastSeen = true }: OnlineIndicatorProps) => {
    if (isOnline) {
        return (
            <div className="online-indicator">
                <span className="online-dot">🟢</span>
                <span className="online-text">Online</span>
            </div>
        );
    }

    if (!lastSeen || !showLastSeen) return null;

    return (
        <div className="online-indicator">
            <span className="online-text text-muted">🕒 Last seen {formatRelativeTime(lastSeen)}</span>
        </div>
    );
};
