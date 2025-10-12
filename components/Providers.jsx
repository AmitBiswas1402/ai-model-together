"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "@/app/_components/AppSidebar";
import AppHeader from "@/app/_components/AppHeader";
import { useUser } from "@clerk/nextjs";
import { db } from "@/config/FirebaseDB";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AISelectedModelContext } from "@/context/AISelectedModelContext";
import { DefaultModel } from "@/shared/AIModelsShared";
import { UserDetailContext } from "@/context/UserDetailContext";

export function ThemeProvider({ children, ...props }) {
  const { user, isLoaded } = useUser();
  const [aiSelectedModels, setAiSelectedModels] = React.useState(DefaultModel);
  const [userDetail, setUserDetail] = React.useState();

  React.useEffect(() => {
    if (isLoaded && user) {
      saveUserToFirestore(user); // Call our helper
    }
  }, [user, isLoaded]);

  // Helper function to save user to Firestore
  const saveUserToFirestore = async (user) => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      if (!email) return; // safety check

      const userRef = doc(db, "users", user.id); // Clerk ID as doc ID
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log("👤 User already exists in Firestore");
        const userInfo = userSnap.data();
        setAiSelectedModels(userInfo?.selectedModelPref);
        setUserDetail(userInfo);
        return;
      }

      const userData = {
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress || "",
        createdAt: new Date(),
      };

      await setDoc(userRef, userData);
      console.log("New user saved to Firestore");
      setUserDetail(userData);
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
    }
  };

  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
        <AISelectedModelContext.Provider
          value={{ aiSelectedModels, setAiSelectedModels }}
        >
          <SidebarProvider>
            <AppSidebar />
            <div className="w-full">
              <AppHeader />
              {children}
            </div>
          </SidebarProvider>
        </AISelectedModelContext.Provider>
      </UserDetailContext.Provider>
    </NextThemesProvider>
  );
}
