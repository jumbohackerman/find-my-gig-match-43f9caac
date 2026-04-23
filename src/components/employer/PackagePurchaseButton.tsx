/**
 * PackagePurchaseButton — opens a modal to buy a shortlist slot package
 * (5 / 10 / 20). Mock billing for now (no real payment).
 *
 * Shows the active package summary inline and a CTA whose label depends
 * on whether any package is active for this job.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Layers, X, Check } from "lucide-react";
import { PACKAGE_PRICING, formatPrice, pricePerSlot, type PackageSize, type ShortlistJobBalance } from "@/domain/shortlist";

interface Props {
  jobId: string;
  balance: ShortlistJobBalance;
  onPurchase: (size: PackageSize) => Promise<boolean>;
}

const SIZES: PackageSize[] = [5, 10, 20];

export default function PackagePurchaseButton({ balance, onPurchase }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<PackageSize | null>(null);

  const noPackage = balance.totalSlots === 0;
  const exhausted = balance.totalSlots > 0 && balance.remainingSlots === 0;

  const buttonLabel = noPackage
    ? "Kup pakiet shortlisty"
    : exhausted
    ? "Dokup sloty"
    : `${balance.remainingSlots} wolnych slotów`;

  const buttonClass = noPackage
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : exhausted
    ? "bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30"
    : "bg-secondary text-secondary-foreground hover:bg-muted border border-border";

  const handleBuy = async (size: PackageSize) => {
    if (busy) return;
    setBusy(size);
    const ok = await onPurchase(size);
    setBusy(null);
    if (ok) setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${buttonClass}`}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        {buttonLabel}
      </button>

      <AnimatePresence>
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
            onClick={() => !busy && setOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md card-gradient rounded-2xl border border-border p-5 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => !busy && setOpen(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-lg p-1"
                aria-label="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Pakiety shortlisty
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Sloty są przypisane do tej oferty. 1 slot = 1 płatne dodanie kandydata do shortlisty.
                </p>
              </div>

              {!noPackage && (
                <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground">Aktywne sloty</span>
                    <span className="font-semibold text-foreground">
                      {balance.usedSlots}/{balance.totalSlots} zużyte · {balance.remainingSlots} wolnych
                    </span>
                  </div>
                  {balance.activePackage && (
                    <div className="text-[11px] text-muted-foreground/80">
                      Aktywny pakiet: {balance.activePackage.packageSize} slotów
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {SIZES.map((size) => {
                  const price = PACKAGE_PRICING[size];
                  const isBusy = busy === size;
                  return (
                    <button
                      key={size}
                      disabled={!!busy}
                      onClick={() => handleBuy(size)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border hover:border-primary/40 hover:bg-secondary/60 transition-colors disabled:opacity-50 text-left"
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">{size} slotów</div>
                        <div className="text-[11px] text-muted-foreground">
                          {pricePerSlot(size)} za slot
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-bold text-foreground">{formatPrice(price)}</div>
                        {isBusy ? (
                          <span className="text-[10px] text-muted-foreground">…</span>
                        ) : (
                          <Check className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-[10px] text-muted-foreground/70 text-center">
                Tryb testowy — nie pobieramy realnych płatności. Każdy zakup tworzy zdarzenie billing dla audytu.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
