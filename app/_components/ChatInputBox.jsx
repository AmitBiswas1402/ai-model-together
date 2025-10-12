import { Button } from "@/components/ui/button";
import { Mic, Paperclip, Send } from "lucide-react";
import AIMultiModels from "./AIMultiModels";

const ChatInputBox = () => {
  return (
    <div className="relative min-h-screen">
      {/* Page Content */}
      <div>
        <AIMultiModels />
      </div>

      {/* Fixed chat Input */}
      <div className="fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4">
        <div className="w-full border rounded-xl shadow-md max-w-2xl p-4">
          <input
            type="text"
            placeholder="Start Asking..."
            className="border-0 outline-none"
          />
          <div className="mt-3 flex justify-between items-center">
            <Button variant={"ghost"} size={"icon"}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <div>
              <Button variant={"ghost"} size={"icon"} className={'mr-2'}>
                <Mic />
              </Button>
              <Button size={"icon"} className={"bg-purple-600"}>
                <Send />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatInputBox;
