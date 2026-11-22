/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const TopSearchContext = createContext({ query: "", setQuery: () => {} });

export function TopSearchProvider({ children }) {
  const [query, setQuery] = useState("");
  return (
    <TopSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </TopSearchContext.Provider>
  );
}

export function useTopSearch() {
  return useContext(TopSearchContext);
}
