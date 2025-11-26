"use client";

import { retrieveRawInitData } from "@telegram-apps/sdk-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { signIn as signInAction } from "~/app/actions";

type AuthContext = {
  isSignedIn: boolean;
  isSigningIn: boolean;
};

export const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setInSignedIn] = useState(false);
  const [isSigningIn, startSignIn] = useTransition();

  useEffect(() => {
    startSignIn(async () => {
      const initDataRaw = retrieveRawInitData();
      await signInAction(initDataRaw ?? "").then((result) => {
        setInSignedIn(result.isAuthorized);
      });
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, isSigningIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
