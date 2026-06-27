"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const Header = () => {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-black">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <h1 className="text-2xl font-bold">AI Website Creator</h1>

        {/* Auth Button */}
        {!user ? (
          <SignInButton mode="modal" forceRedirectUrl="/workspace">
            <Button size="lg" className="flex items-center cursor-pointer">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </SignInButton>
        ) : (
          <Link href="/workspace">
            <Button size="lg" className="flex items-center cursor-pointer">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
