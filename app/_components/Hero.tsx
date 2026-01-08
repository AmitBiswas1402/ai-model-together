"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, HomeIcon, ImagePlus, Key, LayoutDashboard, User } from "lucide-react";
import { useState } from "react";

const suggestions = [
  {
    label: "Dashboard",
    prompt:
      "Create a responsive SaaS analytics dashboard with charts and KPI cards.",
    icon: LayoutDashboard,
  },
  {
    label: "SignUp Form",
    prompt:
      "Design a modern signup form with email, password, and social login options.",
    icon: Key,
  },
  {
    label: "Hero",
    prompt: "Build a SaaS hero section with title, subtitle, CTA, and image.",
    icon: HomeIcon,
  },
  {
    label: "User Profile Card",
    prompt:
      "Create a user profile card with avatar, name, bio, and follow button.",
    icon: User,
  },
];

const Hero = () => {
    const [userInput, setUserInput] = useState<string>("");
    
  return (
    <div className="flex flex-col items-center h-[80vh] justify-center">
        {/* Header */}
      <h2 className="font-bold text-7xl">What should we Design?</h2>
      <p className="mt-2 text-xl text-gray-500">Explore with AI</p>

      <div className="w-full max-w-xl p-5 border mt-5 rounded-2xl">

        <textarea
        placeholder="Describe your page design"
        className="w-full h-24 focus:outline-none focus:ring-0 resize-none"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        />

        <div className="flex justify-between items-center">
            <div>
                <Input
              type="file"
              accept="image/*"
              id="image-upload"
            //   onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              <ImagePlus />
            </Button>

            </div>
            <Button
            size={"icon-lg"}
            className="rounded-full"
            disabled={!userInput}
            >
            <ArrowUp />
            </Button>

        </div>

        <div className="mt-4 flex gap-2.5 flex-wrap justify-center">
            {suggestions.map((suggestion, index) => (
                <Button
                key={index}
                variant={"outline"}
                onClick={() => setUserInput(suggestion.prompt)} 
                >
                    <suggestion.icon className="mr-1" />
                    {suggestion.label}

                </Button>
            ))}

        </div>

      </div>

    </div>
  )
}
export default Hero;