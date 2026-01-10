"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const MenuOptions = [
  {
    name: "Pricing",
    path: "/pricing",
  },
  {
    name: "Contact us",
    path: "/contact",
  },
];

const Header = () => {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between p-3 shadow">
      {/* logo */}
      <div className="flex gap-2 items-center">
        <Image src={"/favicon.ico"} alt="logo" width={35} height={35} />
        <h2 className="font-bold text-xl">Web Creator</h2>
      </div>

      <div className="flex gap-3">
        {MenuOptions.map((menu, index) => (
          <Button key={index} variant={"ghost"}>
            {menu.name}
          </Button>
        ))}
      </div>

      {/* get started */}
      <div>
        {!user ? (
          <SignInButton mode="modal" forceRedirectUrl={"/workspace"}>
            <Button>
              Get Started <ArrowRight />
            </Button>
          </SignInButton>
        ) : (
          <Link href={"/workspace"}>
            <Button>
              Get Started <ArrowRight />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
export default Header;
