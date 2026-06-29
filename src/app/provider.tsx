"use client";

import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
  UserDetailContext,
  type UserDetail,
} from "@/context/UserDetailsContext";
import { DesignHtmlGetter, OnSaveContext } from "@/context/OnSaveContext";

const Provider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { user } = useUser();
  const [userDetails, setUserDetails] = useState<UserDetail | undefined>();
  const [onSaveDate, setOnSaveDate] = useState<Date | null>(null);
  const designHtmlGetterRef = useRef<DesignHtmlGetter | null>(null);

  const setDesignHtmlGetter = (getter: DesignHtmlGetter | null) => {
    designHtmlGetterRef.current = getter;
  };

  const getDesignHtml = () => {
    return designHtmlGetterRef.current?.() ?? null;
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const createUser = async () => {
      try {
        const res = await axios.post("/api/users", {});
        console.log(res.data.user);
        setUserDetails(res.data.user);
      } catch (error) {
        console.error("Failed to create/fetch user", error);
      }
    };

    void createUser();
  }, [user]);

  return (
    <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
      <OnSaveContext.Provider
        value={{
          onSaveDate,
          setOnSaveDate,
          setDesignHtmlGetter,
          getDesignHtml,
        }}
      >
        {children}
      </OnSaveContext.Provider>
    </UserDetailContext.Provider>
  );
};

export default Provider;
