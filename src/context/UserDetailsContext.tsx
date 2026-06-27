import { createContext } from "react";

export type UserDetail = {
  id?: number;
  name?: string;
  email?: string;
  credits?: number;
};

export interface UserDetailContextType {
  userDetails: UserDetail | undefined;
  setUserDetails: (userDetails: UserDetail | undefined) => void;
}

export const UserDetailContext = createContext<UserDetailContextType | null>(null);