import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

type Props = {
  onSave: () => void;
  saving?: boolean;
};

const PlaygroundHeader = ({ onSave, saving }: Props) => {
  return (
    <div className="flex items-center justify-between border-b p-4 shadow-md">
      <Link href="/workspace" className="text-xl font-bold">
        AI Website Creator
      </Link>

      <div className="flex items-center gap-3">
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-primary text-white hover:bg-primary/90"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
        <UserButton />
      </div>
    </div>
  );
};
export default PlaygroundHeader;
