import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Messages } from "../[projectId]/page";
import Loading from "./Loading";

type Props = {
  messages: Messages[];
  onSend: (input: string) => void;
  loading: boolean;
};

const ChatSection = ({ messages, onSend, loading }: Props) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r bg-background lg:w-96">
      <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !loading ? (
          <p className="text-muted-foreground">No messages yet.</p>
        ) : (
          <>
            {messages.map((message, index) => (
              <div key={index}>
                <div
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2.5 text-[13px] leading-relaxed ${
                      message.role === "user"
                        ? "rounded-2xl rounded-br-md bg-gray-800 text-gray-200"
                        : "rounded-2xl rounded-bl-md border border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-gray-200/80 bg-gray-100 px-4 py-2.5">
                  <Loading label="Designing your page" />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <div className="flex items-end gap-2 rounded-2xl border bg-muted/30 p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            disabled={loading}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-9 w-9 shrink-0 rounded-full"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
