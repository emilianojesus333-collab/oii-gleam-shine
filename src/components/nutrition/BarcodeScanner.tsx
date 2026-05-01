import { useEffect, useRef, useState } from "react";
import { X, Camera } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { searchFoodByBarcode, type FoodSearchResult } from "@/utils/foodSearch";
import { toast } from "sonner";

interface BarcodeScannerProps {
  onFoodFound: (food: FoodSearchResult) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onFoodFound, onClose }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<"requesting" | "scanning" | "found" | "denied" | "error">("requesting");
  const [foundFood, setFoundFood] = useState<FoodSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const detectedRef = useRef(false);

  useEffect(() => {
    let active = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        // Check permission first
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream.getTracks().forEach((t) => t.stop());

        if (!active) return;
        setStatus("scanning");

        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          async (result, err) => {
            if (!active || detectedRef.current) return;
            if (result) {
              detectedRef.current = true;
              const barcode = result.getText();
              setSearching(true);
              try {
                const food = await searchFoodByBarcode(barcode);
                if (food) {
                  setFoundFood(food);
                  setStatus("found");
                } else {
                  detectedRef.current = false;
                  toast.error("Produto não encontrado. Tenta pesquisar pelo nome.");
                }
              } catch {
                detectedRef.current = false;
                toast.error("Erro ao pesquisar produto.");
              } finally {
                setSearching(false);
              }
            }
            // Suppress expected "not found" errors from zxing
            void err;
          }
        );
      } catch (e: unknown) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      }
    })();

    return () => {
      active = false;
      readerRef.current?.reset();
    };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "#000",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        padding: "16px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)",
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Scanner de Código de Barras</span>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={18} color="white" />
        </button>
      </div>

      {/* Camera feed */}
      {(status === "scanning" || status === "found") && (
        <video
          ref={videoRef}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          playsInline
          muted
        />
      )}

      {/* Scan overlay */}
      {status === "scanning" && !searching && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* Dark overlay frame */}
          <div style={{ position: "relative", width: 260, height: 160 }}>
            {/* Corner marks */}
            {[
              { top: 0, left: 0, borderTop: "3px solid #22C55E", borderLeft: "3px solid #22C55E" },
              { top: 0, right: 0, borderTop: "3px solid #22C55E", borderRight: "3px solid #22C55E" },
              { bottom: 0, left: 0, borderBottom: "3px solid #22C55E", borderLeft: "3px solid #22C55E" },
              { bottom: 0, right: 0, borderBottom: "3px solid #22C55E", borderRight: "3px solid #22C55E" },
            ].map((style, i) => (
              <div key={i} style={{
                position: "absolute", width: 24, height: 24, ...style,
              }} />
            ))}

            {/* Scan line */}
            <div style={{
              position: "absolute", left: 4, right: 4,
              height: 2, background: "#22C55E",
              boxShadow: "0 0 8px #22C55E",
              animation: "scanLine 2s linear infinite",
            }} />
          </div>

          <style>{`
            @keyframes scanLine {
              0%   { top: 8px; }
              50%  { top: calc(100% - 10px); }
              100% { top: 8px; }
            }
          `}</style>

          <p style={{
            position: "absolute", bottom: 100,
            color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500,
          }}>
            Aponta para o código de barras
          </p>
        </div>
      )}

      {/* Searching spinner */}
      {searching && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)",
          gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.15)",
            borderTopColor: "#22C55E",
            animation: "spin 0.8s linear infinite",
          }} />
          <p style={{ color: "white", fontSize: 13 }}>A pesquisar produto...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Requesting permission */}
      {status === "requesting" && (
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          padding: 32,
        }}>
          <Camera size={48} color="rgba(255,255,255,0.3)" />
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, textAlign: "center" }}>
            A pedir acesso à câmara...
          </p>
        </div>
      )}

      {/* Denied */}
      {status === "denied" && (
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          padding: 32,
        }}>
          <Camera size={48} color="#F87171" />
          <p style={{ color: "white", fontSize: 15, fontWeight: 700, textAlign: "center" }}>
            Permissão de câmara negada
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center" }}>
            Vai às definições do teu browser e permite o acesso à câmara para usar o scanner.
          </p>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "12px 24px", borderRadius: 12,
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 16,
          padding: 32,
        }}>
          <p style={{ color: "#F87171", fontSize: 15, fontWeight: 700, textAlign: "center" }}>
            Câmara não disponível
          </p>
          <button type="button" onClick={onClose}
            style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.1)", border: "none", color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Fechar
          </button>
        </div>
      )}

      {/* Found food bottom sheet */}
      {status === "found" && foundFood && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "#1A1A1A",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 40px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

          <p style={{ fontSize: 11, color: "#22C55E", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>
            PRODUTO ENCONTRADO
          </p>
          <p style={{ fontSize: 17, fontWeight: 800, color: "white", marginBottom: 4 }}>
            {foundFood.name}
          </p>
          {foundFood.brand && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{foundFood.brand}</p>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            <MacroPill label={`${foundFood.calories} kcal`} color="#F97316" bg="rgba(249,115,22,0.12)" />
            <MacroPill label={`P ${foundFood.protein}g`} color="#60A5FA" bg="rgba(96,165,250,0.12)" />
            <MacroPill label={`C ${foundFood.carbs}g`} color="#FBBF24" bg="rgba(251,191,36,0.12)" />
            <MacroPill label={`G ${foundFood.fat}g`} color="#F87171" bg="rgba(248,113,113,0.12)" />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => { detectedRef.current = false; setStatus("scanning"); setFoundFood(null); }}
              style={{
                flex: 1, padding: 14, borderRadius: 12,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => { onFoodFound(foundFood); onClose(); }}
              style={{
                flex: 2, padding: 14, borderRadius: 12,
                background: "#16a34a", border: "none",
                color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Adicionar à refeição
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MacroPill = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
    color, background: bg,
  }}>
    {label}
  </span>
);
