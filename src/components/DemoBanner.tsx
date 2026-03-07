import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle } from "lucide-react";

const DemoBanner = () => {
  const { user } = useAuth();
  if (user) return null;

  return (
    <div className="w-full px-4 py-2 bg-yellow-400/10 border-b border-yellow-400/20 flex items-center justify-center gap-2 text-yellow-400 text-xs font-medium">
      <AlertTriangle className="w-3.5 h-3.5" />
      Tryb demo — dane nie są zapisywane
    </div>
  );
};

export default DemoBanner;
