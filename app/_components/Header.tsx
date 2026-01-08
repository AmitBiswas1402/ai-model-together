"use client"

import { Button } from "@/components/ui/button";
import Image from "next/image"

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

      <div>
        <Button>
          Get Started 
        </Button>
      </div>

    </div>
  )
}
export default Header