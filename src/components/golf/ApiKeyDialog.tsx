import React, { useState } from "react";
import { Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getStoredApiKey, setStoredApiKey } from "@/utils/ocrService";

interface ApiKeyDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ open, onClose, onSaved }) => {
  const [value, setValue] = useState(getStoredApiKey);
  const [show, setShow] = useState(false);

  const handleSave = () => {
    const trimmed = value.trim();
    setStoredApiKey(trimmed);
    onSaved(trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Anthropic API Key
          </DialogTitle>
          <DialogDescription>
            Required for real OCR scanning. Your key is stored locally and never sent
            anywhere except Anthropic's API.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-2">
          <Input
            type={show ? "text" : "password"}
            placeholder="sk-ant-..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="pr-10 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={!value.trim()}>
            Save Key
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
