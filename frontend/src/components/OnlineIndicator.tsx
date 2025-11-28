// import { useEffect, useState } from "react";

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

    const getLastSeenText = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} mins ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    return (
        <div className="online-indicator">
            <span className="online-text text-muted">🕒 Last seen {getLastSeenText(lastSeen)}</span>
        </div>
    );
};
