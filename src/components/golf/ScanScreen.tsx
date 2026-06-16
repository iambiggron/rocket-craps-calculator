import React, { useRef } from "react";
import { Camera, Image, FlaskConical, ArrowLeft, Key, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScanScreenProps {
  onBack: () => void;
  onImageSelected: (file: File | null) => void;
  onUseSample: () => void;
  onSetApiKey: () => void;
  hasApiKey: boolean;
}

const ScanScreen: React.FC<ScanScreenProps> = ({
  onBack,
  onImageSelected,
  onUseSample,
  onSetApiKey,
  hasApiKey,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) onImageSelected(file);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background px-4 pb-8">
      {/* Header */}
      <div className="flex items-center pt-12 pb-6">
        <button onClick={onBack} className="mr-3 p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Scan Scorecard</h1>
          <p className="text-xs text-muted-foreground">Take a photo or choose from your library</p>
        </div>
      </div>

      {/* API key status */}
      <button
        onClick={onSetApiKey}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-left w-full border transition-colors ${
          hasApiKey
            ? "bg-green-500/10 border-green-500/20 hover:bg-green-500/15"
            : "bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15"
        }`}
      >
        {hasApiKey ? (
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        ) : (
          <Key className="w-4 h-4 text-amber-400 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${hasApiKey ? "text-green-300" : "text-amber-300"}`}>
            {hasApiKey ? "API key configured" : "API key required for real OCR"}
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            {hasApiKey ? "Tap to update your Anthropic API key" : "Tap to set your Anthropic API key"}
          </p>
        </div>
      </button>

      {/* Upload area */}
      <div
        className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl min-h-48 mb-6 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Image className="w-12 h-12 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Tap to select a photo</p>
        <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, HEIC supported</p>
      </div>

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full h-14 text-base font-semibold gap-3 rounded-2xl"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-5 h-5" />
          Take a Photo
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-base font-semibold gap-3 rounded-2xl"
          onClick={() => fileInputRef.current?.click()}
        >
          <Image className="w-5 h-5" />
          Choose from Library
        </Button>

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          variant="secondary"
          size="lg"
          className="w-full h-14 text-base font-semibold gap-3 rounded-2xl"
          onClick={onUseSample}
        >
          <FlaskConical className="w-5 h-5" />
          Use Sample Scorecard
        </Button>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center mt-4">
        Sample data lets you try the app without scanning a real card
      </p>
    </div>
  );
};

export default ScanScreen;
