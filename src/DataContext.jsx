import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { db } from "./db";

const DataContext = createContext(null);

// Wraps the localStorage "db" and forces a re-render whenever it changes,
// either from this tab (custom event) or another tab (native storage event).
// This is what makes the demo feel like a shared backend across tabs.
export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const onStorage = () => bump();
    const onLocalChange = () => bump();
    window.addEventListener("storage", onStorage);
    window.addEventListener("local-db-change", onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("local-db-change", onLocalChange);
    };
  }, [bump]);

  const value = {
    version, // included so consumers can depend on it to re-derive data
    users: db.getUsers(),
    referrals: db.getReferrals(),
    createUser: (args) => {
      const user = db.createUser(args);
      bump();
      return user;
    },
    completeFirstConsultation: (userId) => {
      const result = db.completeFirstConsultation(userId);
      bump();
      return result;
    },
    findUserByEmail: (email) => db.findUserByEmail(email),
    findUserByReferralCode: (code) => db.findUserByReferralCode(code),
    findUserById: (id) => db.findUserById(id),
    getSessionUserId: () => db.getSessionUserId(),
    login: (id) => {
      db.setSessionUserId(id);
      bump();
    },
    logout: () => {
      db.clearSession();
      bump();
    },
    resetAll: () => {
      db.resetAll();
      bump();
    },
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
