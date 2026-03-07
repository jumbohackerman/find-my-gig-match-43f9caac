import { Zap, UserCheck } from "lucide-react";
import type { ApplicationSource } from "@/types/application";

interface Props {
  source: ApplicationSource;
}

const SourceLabel = ({ source }: Props) => {
  if (source === "ai") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-semibold">
        <Zap className="w-3 h-3" /> AI Shortlista
      </span>
    );
  }
  if (source === "employer") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
        <UserCheck className="w-3 h-3" /> Wybór pracodawcy
      </span>
    );
  }
  return null;
};

export default SourceLabel;
