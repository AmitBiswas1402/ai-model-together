"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import axios from "axios";
import { UserDetailContext } from "@/context/UserDetailContext";
import { OnSaveContext } from "@/context/OnSaveContext";

const provider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<any>();
  const [onSaveDate, setOnSaveDate] = useState<any>();

  useEffect(() => {
    user && CreateNewUser();
  }, [user]);

  const CreateNewUser = async () => {
    try {
      const result = await axios.post("/api/users", {});
      console.log("API response:", result.data);
      setUserDetails(result.data.user);
    } catch (error: any) {
      console.error("API call failed:", error?.response?.data || error.message);
    }
  };

  return (
    <div>
      <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
        <OnSaveContext.Provider value={{ onSaveDate, setOnSaveDate }}>
          {children}
        </OnSaveContext.Provider>
      </UserDetailContext.Provider>
    </div>
  );
};

export default provider;