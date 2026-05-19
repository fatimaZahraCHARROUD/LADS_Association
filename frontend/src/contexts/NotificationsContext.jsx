// contexts/NotificationsContext.jsx

import { createContext, useContext, useState } from "react";

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [counts, setCounts] = useState({
    contacts: 0,
    memberships: 0,
    registrations: 0,
  });

  return (
    <NotificationsContext.Provider
      value={{ counts, setCounts }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}