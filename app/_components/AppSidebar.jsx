"use client";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const { user, isSignedIn } = useUser();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <h2 className="font-bold text-xl">All AI</h2>
            </div>

            {/* Theme toggle */}
            {theme === "light" ? (
              <Button
                onClick={() => setTheme("dark")}
                variant="ghost"
                size="icon"
              >
                <Sun className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => setTheme("light")}
                variant="ghost"
                size="icon"
              >
                <Moon className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button className="mt-7 w-full" size="lg">
            + New Chat
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="p-3">
            <h2 className="font-bold text-lg">Chats</h2>
            {!isSignedIn ? (
              <p className="text-sm text-gray-400">
                Sign in to chat with All AI
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                Welcome back, {user.firstName || "User"}!
              </p>
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-3 mb-5">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button className="w-full" size="lg">
                Sign In / Sign Up
              </Button>
            </SignInButton>
          ) : (
            <div className="flex items-center justify-between w-full border rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-8 h-8",
                    },
                  }}
                />
                <span className="text-sm font-medium">
                  {user?.fullName || "User"}
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
