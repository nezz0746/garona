import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  rang: number;
} | null;

export type AuthContextType = {
  user: AuthUser;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  updateUser: (updates: Partial<NonNullable<AuthUser>>) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: () => {},
  signOut: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const API_URL = __DEV__
  ? "http://localhost:3001"
  : process.env.EXPO_PUBLIC_API_URL;

console.log({ API_URL });
