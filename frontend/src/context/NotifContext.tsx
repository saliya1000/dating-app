import { createContext } from "react";

export const NotifContext = createContext<{
    unreadChats: number;
    incomingRequests: number;
    onlineUsers: number[];
    currentUser: any;
}>({ unreadChats: 0, incomingRequests: 0, onlineUsers: [], currentUser: null });
