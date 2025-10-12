"use client";

import AIModelsList from "../../shared/AIModelsList";
import Image from "next/image";
import { useContext, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MessageSquare } from "lucide-react";
import { AISelectedModelContext } from "@/context/AISelectedModelContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/FirebaseDB";
import { useUser } from "@clerk/nextjs";

const AIMultiModels = () => {
  const { user } = useUser();
  const [aiModelList, setAiModelList] = useState(AIModelsList);
  const { aiSelectedModels, setAiSelectedModels } = useContext(
    AISelectedModelContext
  );

  // Toggle model enable/disable
  const onToggleChange = (model, value) => {
    setAiModelList((prev) =>
      prev.map((m) => (m.model === model ? { ...m, enable: value } : m))
    );
  };

  // Handle model selection and sync to Firestore
  const onSelectValue = async (parentModel, value) => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.id); // ✅ Use Clerk ID instead of email
    const userSnap = await getDoc(userDocRef);

    // ✅ Create user doc if it doesn't exist
    if (!userSnap.exists()) {
      await setDoc(userDocRef, {
        name: user.fullName,
        email: user.primaryEmailAddress?.emailAddress,
        selectedModelPref: { [parentModel]: { modelId: value } },
        createdAt: new Date(),
      });
    } else {
      await updateDoc(userDocRef, {
        [`selectedModelPref.${parentModel}`]: { modelId: value },
      });
    }

    // ✅ Update context
    setAiSelectedModels((prev) => ({
      ...prev,
      [parentModel]: { modelId: value },
    }));

    console.log(`✅ Updated model: ${parentModel} -> ${value}`);
  };

  return (
    <div className="flex flex-1 h-[75vh] border-b">
      {aiModelList.map((model, index) => (
        <div
          key={index}
          className={`flex flex-col border-r h-full overflow-auto transition-all ${
            model.enable ? "flex-1 min-w-[400px]" : "w-[100px] flex-none"
          }`}
        >
          <div className="flex w-full h-[70px] items-center justify-between border-b p-4">
            <div className="flex items-center gap-3">
              <Image
                src={model.icon}
                alt={model.model}
                width={24}
                height={24}
              />

              {model.enable && (
                <Select
                  defaultValue={aiSelectedModels[model.model]?.modelId}
                  onValueChange={(value) => onSelectValue(model.model, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue
                      placeholder={
                        aiSelectedModels[model.model]?.modelId ||
                        "Select a Model"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {model.subModel.map((subModel, subIndex) => (
                      <SelectItem key={subIndex} value={subModel.name}>
                        {subModel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              {model.enable ? (
                <Switch
                  checked={model.enable}
                  onCheckedChange={(v) => onToggleChange(model.model, v)}
                />
              ) : (
                <MessageSquare
                  onClick={() => onToggleChange(model.model, true)}
                  className="cursor-pointer"
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIMultiModels;
