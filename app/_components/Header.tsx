"use client"

import Image from "next/image"

const Header = () => {
  return (
    <div className="flex items-center justify-between p-3 shadow">
        {/* logo */}
      <div className="flex gap-2 items-center">
        <Image src={"/globe.svg"} alt="logo" width={35} height={35} />
        <h2 className="font-bold text-xl">AI Creator</h2>
      </div>

    </div>
  )
}
export default Header