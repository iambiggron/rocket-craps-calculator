import React, { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Minus,
  Trash2,
  Archive,
  RefreshCw,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  Dices,
  Rocket,
  Sun,
  Moon,
  Users,
  Pencil,
  Check,
  X,
  Star,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  hasBoughtIn: boolean;
  rebuys: number;
  finalChips: number;
}

interface GameSession {
  id: string;
  date: string;
  buyIn: number;
  initialChips: number;
  players: Player[];
  pot: number;
  chipValue: number;
  notes?: string;
}

interface KnownPlayer {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const fmtChipValue = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

const newPlayer = (name = ""): Player => ({
  id: crypto.randomUUID(),
  name,
  hasBoughtIn: false,
  rebuys: 0,
  finalChips: 0,
});

const calcChipValue = (buyIn: number, initialChips: number) =>
  initialChips > 0 ? buyIn / 2 / initialChips : 0;

const calcPot = (players: Player[], buyIn: number) => {
  const owners = players.filter((p) => p.hasBoughtIn).length;
  const totalRebuys = players.reduce((s, p) => s + p.rebuys, 0);
  return (owners + totalRebuys) * (buyIn / 2);
};

const calcNumOwners = (players: Player[]) =>
  players.filter((p) => p.hasBoughtIn).length;

function playerStats(
  player: Player,
  buyIn: number,
  chipValue: number,
  potSharePerOwner: number
) {
  const chipsValue = player.finalChips * chipValue;
  const potShare = player.hasBoughtIn ? potSharePerOwner : 0;
  const totalPayout = chipsValue + potShare;
  const totalPaid =
    (player.hasBoughtIn ? 1 : 0) * buyIn + player.rebuys * buyIn;
  const net = totalPayout - totalPaid;
  return { chipsValue, potShare, totalPayout, totalPaid, net };
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const ARCHIVE_KEY = "craps_archive";
const PLAYERS_KEY = "craps_players";

const loadArchive = (): GameSession[] => {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveArchive = (sessions: GameSession[]) => {
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(sessions));
};

const loadKnownPlayers = (archive: GameSession[]): KnownPlayer[] => {
  try {
    const stored: KnownPlayer[] = JSON.parse(
      localStorage.getItem(PLAYERS_KEY) || "[]"
    );
    // Seed any names from archive that aren't already stored
    const storedNames = new Set(stored.map((p) => p.name.toLowerCase()));
    const merged = [...stored];
    archive.forEach((s) =>
      s.players.forEach((p) => {
        const trimmed = p.name.trim();
        if (trimmed && !storedNames.has(trimmed.toLowerCase())) {
          merged.push({ id: crypto.randomUUID(), name: trimmed });
          storedNames.add(trimmed.toLowerCase());
        }
      })
    );
    if (merged.length > stored.length) {
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(merged));
    }
    return merged;
  } catch {
    return [];
  }
};

const saveKnownPlayers = (players: KnownPlayer[]) => {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
};

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title="Toggle light/dark mode"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

// ─── PlayerRow ────────────────────────────────────────────────────────────────

interface PlayerRowProps {
  player: Player;
  buyIn: number;
  chipValue: number;
  potSharePerOwner: number;
  knownPlayerNames: string[];
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onRemove: (id: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  buyIn,
  chipValue,
  potSharePerOwner,
  knownPlayerNames,
  onUpdate,
  onRemove,
}) => {
  const { chipsValue, potShare, totalPayout, net } = playerStats(
    player,
    buyIn,
    chipValue,
    potSharePerOwner
  );

  const netColor =
    net > 0 ? "text-emerald-500" : net < 0 ? "text-destructive" : "text-muted-foreground";

  const datalistId = `players-list-${player.id}`;

  return (
    <div className="grid grid-cols-[200px_100px_140px_140px_90px_90px_110px_32px] gap-2 items-center px-3 py-3 rounded-lg bg-card border border-border hover:border-ring/40 transition-colors">
      {/* Name with datalist dropdown */}
      <div>
        <Input
          list={datalistId}
          value={player.name}
          onChange={(e) => onUpdate(player.id, { name: e.target.value })}
          placeholder="Player name"
          className="h-8 text-sm"
        />
        <datalist id={datalistId}>
          {knownPlayerNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      {/* Bought-in toggle */}
      <button
        onClick={() => onUpdate(player.id, { hasBoughtIn: !player.hasBoughtIn })}
        className={`px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
          player.hasBoughtIn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        }`}
        title="Toggle initial buy-in"
      >
        {player.hasBoughtIn ? "Bought In ✓" : "Buy In"}
      </button>

      {/* Rebuy counter */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdate(player.id, { rebuys: Math.max(0, player.rebuys - 1) })}
          disabled={player.rebuys === 0}
          className="w-6 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <Minus size={10} />
        </button>
        <span className="w-8 text-center text-sm font-mono font-semibold text-foreground">
          {player.rebuys}
        </span>
        <button
          onClick={() => onUpdate(player.id, { rebuys: player.rebuys + 1 })}
          className="w-6 h-6 rounded bg-accent/80 hover:bg-accent text-accent-foreground flex items-center justify-center transition-colors"
          title="Rebuy"
        >
          <Plus size={10} />
        </button>
        <span className="text-xs text-muted-foreground ml-0.5">rebuys</span>
      </div>

      {/* Final chips input */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={player.finalChips === 0 ? "" : player.finalChips}
          onChange={(e) =>
            onUpdate(player.id, { finalChips: Math.max(0, parseInt(e.target.value) || 0) })
          }
          placeholder="0"
          className="w-20 h-8 text-sm"
        />
        <span className="text-xs text-muted-foreground">final chips</span>
      </div>

      {/* Chip cash value */}
      <div>
        <div className="text-xs text-muted-foreground">chip value</div>
        <div className="text-sm font-mono text-foreground">{fmt(chipsValue)}</div>
      </div>

      {/* Equity stake */}
      <div>
        <div className="text-xs text-muted-foreground">equity stake</div>
        <div className="text-sm font-mono text-foreground">{fmt(potShare)}</div>
      </div>

      {/* Total payout + net */}
      <div>
        <div className="text-xs text-muted-foreground">payout</div>
        <div className="text-sm font-mono font-semibold text-foreground">{fmt(totalPayout)}</div>
        <div className={`text-xs font-mono font-bold ${netColor}`}>
          {net >= 0 ? "+" : ""}{fmt(net)}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(player.id)}
        className="w-7 h-7 rounded bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};

// ─── ArchiveEntry ─────────────────────────────────────────────────────────────

const ArchiveEntry: React.FC<{
  session: GameSession;
  onDelete: (id: string) => void;
}> = ({ session, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const chipValue = calcChipValue(session.buyIn, session.initialChips);
  const numOwners = calcNumOwners(session.players);
  const potSharePerOwner = numOwners > 0 ? session.pot / numOwners : 0;
  const archiveTotalRebuys = session.players.reduce((s, p) => s + p.rebuys, 0);
  const archiveGameTotal = (numOwners + archiveTotalRebuys) * session.buyIn;
  const archiveWinner = session.players.length > 0
    ? session.players.reduce((best, p) => {
        const bStats = playerStats(best, session.buyIn, chipValue, potSharePerOwner);
        const pStats = playerStats(p, session.buyIn, chipValue, potSharePerOwner);
        return pStats.net > bStats.net ? p : best;
      })
    : null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <Dices size={15} className="text-accent shrink-0" />
          <span className="text-sm font-medium text-foreground">{session.date}</span>
          <Badge variant="outline" className="text-xs">
            {session.players.length} players
          </Badge>
          <Badge variant="outline" className="text-xs border-accent/40 text-accent">
            Buy-in: {fmt(session.buyIn)}
          </Badge>
          <span className="text-xs text-muted-foreground">Game Total: {fmt(archiveGameTotal)}</span>
          {session.notes && (
            <span
              className="text-xs text-muted-foreground italic max-w-[200px] truncate"
              title={session.notes}
            >
              {session.notes}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={15} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={15} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
            <span>Chip value: {fmtChipValue(chipValue)}/chip</span>
            <span>Bank value: {fmt(session.pot)}</span>
            <span>Owners: {numOwners}</span>
            <span>Value per: {fmt(potSharePerOwner)}</span>
            <span>Re-buys: {archiveTotalRebuys}</span>
            {archiveWinner && (
              <span className="text-foreground font-medium">Winner: {archiveWinner.name || "—"}</span>
            )}
          </div>
          <div className="space-y-2">
            {session.players.map((p) => {
              const stats = playerStats(p, session.buyIn, chipValue, potSharePerOwner);
              const netColor =
                stats.net > 0
                  ? "text-emerald-500"
                  : stats.net < 0
                  ? "text-destructive"
                  : "text-muted-foreground";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-2 gap-2"
                >
                  <span className="text-foreground font-medium w-28 truncate">{p.name || "—"}</span>
                  <span className="text-muted-foreground text-xs">
                    {p.hasBoughtIn ? "✓ bought in" : "no buy-in"}
                    {p.rebuys > 0 ? ` · ${p.rebuys} rebuy${p.rebuys > 1 ? "s" : ""}` : ""}
                  </span>
                  <span className="text-muted-foreground text-xs">{p.finalChips} chips</span>
                  <span className="text-foreground font-mono">{fmt(stats.totalPayout)}</span>
                  <span className={`font-mono font-bold text-xs ${netColor}`}>
                    {stats.net >= 0 ? "+" : ""}{fmt(stats.net)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PlayersTab ───────────────────────────────────────────────────────────────

interface PlayersTabProps {
  knownPlayers: KnownPlayer[];
  archive: GameSession[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

const PlayersTab: React.FC<PlayersTabProps> = ({
  knownPlayers,
  archive,
  onAdd,
  onDelete,
  onRename,
}) => {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const getPlayerArchiveStats = (name: string) => {
    const sessions = archive.filter((s) =>
      s.players.some((p) => p.name.toLowerCase() === name.toLowerCase())
    );
    if (sessions.length === 0) {
      return { gamesPlayed: 0, highestChips: 0, highestPayout: 0, avgNet: 0 };
    }
    const entries = sessions.map((s) => {
      const p = s.players.find((pl) => pl.name.toLowerCase() === name.toLowerCase())!;
      const cv = calcChipValue(s.buyIn, s.initialChips);
      const owners = calcNumOwners(s.players);
      const potPerOwner = owners > 0 ? s.pot / owners : 0;
      const stats = playerStats(p, s.buyIn, cv, potPerOwner);
      return { finalChips: p.finalChips, payout: stats.totalPayout, net: stats.net };
    });
    return {
      gamesPlayed: sessions.length,
      highestChips: Math.max(...entries.map((e) => e.finalChips)),
      highestPayout: Math.max(...entries.map((e) => e.payout)),
      avgNet: entries.reduce((s, e) => s + e.net, 0) / entries.length,
    };
  };

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (knownPlayers.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setNewName("");
  };

  const startEdit = (player: KnownPlayer) => {
    setEditingId(player.id);
    setEditValue(player.name);
  };

  const commitEdit = (id: string) => {
    const trimmed = editValue.trim();
    if (
      trimmed &&
      !knownPlayers.some(
        (p) => p.id !== id && p.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      onRename(id, trimmed);
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Players
        </h2>
        <span className="text-xs text-muted-foreground">
          {knownPlayers.length} player{knownPlayers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Add new player */}
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          placeholder="New player name…"
          className="h-9"
        />
        <Button onClick={handleAdd} className="shrink-0">
          <Plus size={14} className="mr-1" />
          Add
        </Button>
      </div>

      {/* Table */}
      {knownPlayers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No players yet.</p>
          <p className="text-xs mt-1 text-muted-foreground/60">
            Add players above, or archive a game to auto-add players.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[minmax(60px,140px)_auto_auto_auto_auto_auto] gap-3 px-4 py-2 bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
            <span>Name</span>
            <span className="w-24 text-center">Games Played</span>
            <span className="w-28 text-right">Highest Chips</span>
            <span className="w-28 text-right">Highest Payout</span>
            <span className="w-24 text-right">Avg Win/Loss</span>
            <span className="w-14" />
          </div>
          <div className="divide-y divide-border">
            {knownPlayers.map((kp) => {
              const stats = getPlayerArchiveStats(kp.name);
              const avgColor =
                stats.avgNet > 0
                  ? "text-emerald-500"
                  : stats.avgNet < 0
                  ? "text-destructive"
                  : "text-muted-foreground";
              const isEditing = editingId === kp.id;
              return (
                <div
                  key={kp.id}
                  className="grid grid-cols-[minmax(60px,140px)_auto_auto_auto_auto_auto] gap-3 px-4 py-3 items-center bg-card hover:bg-muted/20 transition-colors"
                >
                  {/* Name / edit */}
                  {isEditing ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit(kp.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => commitEdit(kp.id)}
                        className="w-6 h-6 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 flex items-center justify-center"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="w-6 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{kp.name}</span>
                  )}

                  <span className="w-24 text-center text-sm font-mono text-foreground">
                    {stats.gamesPlayed}
                  </span>
                  <span className="w-28 text-right text-sm font-mono text-foreground">
                    {stats.gamesPlayed > 0 ? stats.highestChips.toLocaleString() : "—"}
                  </span>
                  <span className="w-28 text-right text-sm font-mono text-foreground">
                    {stats.gamesPlayed > 0 ? fmt(stats.highestPayout) : "—"}
                  </span>
                  <span
                    className={`w-24 text-right text-sm font-mono font-semibold ${
                      stats.gamesPlayed > 0 ? avgColor : "text-muted-foreground"
                    }`}
                  >
                    {stats.gamesPlayed > 0
                      ? `${stats.avgNet >= 0 ? "+" : ""}${fmt(stats.avgNet)}`
                      : "—"}
                  </span>

                  {/* Actions */}
                  <div className="w-14 flex gap-1 justify-end">
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(kp)}
                        className="w-6 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                      >
                        <Pencil size={11} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(kp.id)}
                      className="w-6 h-6 rounded bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Calculator ──────────────────────────────────────────────────────────

const CrapsCalculator: React.FC = () => {
  const [buyIn, setBuyIn] = useState(25);
  const [initialChips, setInitialChips] = useState(500);
  const [players, setPlayers] = useState<Player[]>([
    newPlayer("Player 1"),
    newPlayer("Player 2"),
  ]);
  const [archive, setArchive] = useState<GameSession[]>(loadArchive);
  const [knownPlayers, setKnownPlayers] = useState<KnownPlayer[]>(() => {
    const arch = loadArchive();
    return loadKnownPlayers(arch);
  });
  const [savedMsg, setSavedMsg] = useState(false);
  const [notes, setNotes] = useState("");

  const chipValue = calcChipValue(buyIn, initialChips);
  const pot = calcPot(players, buyIn);
  const numOwners = calcNumOwners(players);
  const potSharePerOwner = numOwners > 0 ? pot / numOwners : 0;
  const totalRebuyCount = players.reduce((s, p) => s + p.rebuys, 0);
  const gameTotal = (numOwners + totalRebuyCount) * buyIn;

  const knownPlayerNames = knownPlayers.map((p) => p.name);

  const updatePlayer = useCallback(
    (id: string, updates: Partial<Player>) =>
      setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...updates } : p))),
    []
  );

  const removePlayer = useCallback(
    (id: string) => setPlayers((ps) => ps.filter((p) => p.id !== id)),
    []
  );

  const addPlayer = () =>
    setPlayers((ps) => [...ps, newPlayer()]);

  const resetGame = () =>
    setPlayers((ps) =>
      ps.map((p) => ({ ...p, rebuys: 0, finalChips: 0, hasBoughtIn: false }))
    );

  const saveToArchive = () => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
      buyIn,
      initialChips,
      players: structuredClone(players),
      pot,
      chipValue,
      notes: notes.trim() || undefined,
    };
    const updatedArchive = [session, ...archive];
    setArchive(updatedArchive);
    saveArchive(updatedArchive);

    // Add any new player names to knownPlayers
    const existingNames = new Set(knownPlayers.map((p) => p.name.toLowerCase()));
    const newKnown = players
      .filter((p) => p.name.trim() && !existingNames.has(p.name.trim().toLowerCase()))
      .map((p) => ({ id: crypto.randomUUID(), name: p.name.trim() }));
    if (newKnown.length > 0) {
      const updatedKnown = [...knownPlayers, ...newKnown];
      setKnownPlayers(updatedKnown);
      saveKnownPlayers(updatedKnown);
    }

    setNotes("");
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const deleteArchiveEntry = (id: string) => {
    const updated = archive.filter((s) => s.id !== id);
    setArchive(updated);
    saveArchive(updated);
  };

  const addKnownPlayer = (name: string) => {
    const updated = [...knownPlayers, { id: crypto.randomUUID(), name }];
    setKnownPlayers(updated);
    saveKnownPlayers(updated);
  };

  const deleteKnownPlayer = (id: string) => {
    const updated = knownPlayers.filter((p) => p.id !== id);
    setKnownPlayers(updated);
    saveKnownPlayers(updated);
  };

  const renameKnownPlayer = (id: string, newName: string) => {
    const updated = knownPlayers.map((p) => (p.id === id ? { ...p, name: newName } : p));
    setKnownPlayers(updated);
    saveKnownPlayers(updated);
  };

  // Game count from archive for a player name (used in payout summary)
  const getGameCount = (name: string): number => {
    if (!name.trim()) return 0;
    return archive.filter((s) =>
      s.players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())
    ).length;
  };

  // Sorted players for payout summary — highest net to lowest
  const sortedByNet = [...players].sort((a, b) => {
    const statsA = playerStats(a, buyIn, chipValue, potSharePerOwner);
    const statsB = playerStats(b, buyIn, chipValue, potSharePerOwner);
    return statsB.net - statsA.net;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Tabs defaultValue="today">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Rocket size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Rocket Craps Payout Calculator
                </h1>
                <p className="text-xs text-muted-foreground">
                  Track buy-ins, rebuys, chip counts &amp; payouts
                </p>
              </div>
            </div>
            <TabsList className="ml-4">
              <TabsTrigger value="today">Today's Game</TabsTrigger>
              <TabsTrigger value="archive">
                Archive
                {archive.length > 0 && (
                  <span className="ml-1.5 bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold">
                    {archive.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="players">
                Players
                {knownPlayers.length > 0 && (
                  <span className="ml-1.5 bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold">
                    {knownPlayers.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">

          {/* ── Today Game Tab ── */}
          <TabsContent value="today" className="space-y-5">

            {/* Settings */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider shrink-0">
                    Game Settings
                  </span>
                  <Separator orientation="vertical" className="h-10 hidden sm:block" />
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Buy-in / Rebuy Amount</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={buyIn}
                        min={1}
                        onChange={(e) => setBuyIn(Math.max(1, parseFloat(e.target.value) || 1))}
                        className="w-24 h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Starting Chips per Buy-in</Label>
                    <Input
                      type="number"
                      value={initialChips}
                      min={1}
                      onChange={(e) =>
                        setInitialChips(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-24 h-9"
                    />
                  </div>

                  <Separator orientation="vertical" className="h-12 hidden sm:block" />

                  {/* Derived stats */}
                  <div className="flex gap-5 flex-wrap ml-auto">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Chip Value</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">{fmtChipValue(chipValue)}</div>
                      <div className="text-xs text-muted-foreground">per chip</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Game Total</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">{fmt(gameTotal)}</div>
                      <div className="text-xs text-muted-foreground">cash in</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Bank Value</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">{fmt(pot)}</div>
                      <div className="text-xs text-muted-foreground">
                        {numOwners} owner{numOwners !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Value per</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">{fmt(potSharePerOwner)}</div>
                      <div className="text-xs text-muted-foreground">equal share</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <strong className="text-foreground">Initial buy-in:</strong> ½ → chips · ½ → bank (+ ownership share)
              </span>
              <span>
                <strong className="text-foreground">Rebuy (+):</strong> ½ → chips · ½ → bank (no new ownership)
              </span>
              <span>
                <strong className="text-foreground">End of night:</strong> chips × {fmtChipValue(chipValue)} + equal bank share
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[200px_100px_140px_140px_90px_90px_110px_32px] gap-2 px-3 text-xs text-muted-foreground uppercase tracking-wider">
              <span className="whitespace-nowrap">Player</span>
              <span className="whitespace-nowrap">Buy-in</span>
              <span className="whitespace-nowrap">Rebuys</span>
              <span className="whitespace-nowrap">Final Chips</span>
              <span className="whitespace-nowrap">Chip Value</span>
              <span className="whitespace-nowrap">Equity</span>
              <span className="whitespace-nowrap">Payout / Net</span>
              <span />
            </div>

            {/* Player rows */}
            <div className="space-y-2">
              {players.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  buyIn={buyIn}
                  chipValue={chipValue}
                  potSharePerOwner={potSharePerOwner}
                  knownPlayerNames={knownPlayerNames}
                  onUpdate={updatePlayer}
                  onRemove={removePlayer}
                />
              ))}
            </div>

            {/* Add player */}
            <Button
              variant="outline"
              onClick={addPlayer}
              className="border-dashed w-full text-muted-foreground hover:text-foreground"
            >
              <PlusCircle size={15} className="mr-2" />
              Add Player
            </Button>

            {/* Summary cards — sorted highest to lowest net */}
            {players.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Payout Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {sortedByNet.map((p, index) => {
                      const stats = playerStats(p, buyIn, chipValue, potSharePerOwner);
                      const netColor =
                        stats.net > 0
                          ? "text-emerald-500"
                          : stats.net < 0
                          ? "text-destructive"
                          : "text-muted-foreground";
                      const gameCount = getGameCount(p.name);
                      const isWinner = index === 0 && sortedByNet.length > 1;
                      return (
                        <div
                          key={p.id}
                          className="relative bg-muted/40 rounded-lg p-3 border border-border"
                        >
                          {isWinner && (
                            <Star size={14} className="absolute top-2 right-2 text-yellow-400 fill-yellow-400" />
                          )}
                          <div className="flex items-baseline gap-1 mb-1 min-w-0">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {p.name || "—"}
                            </span>
                            {gameCount > 0 && (
                              <span className="text-xs text-muted-foreground font-normal shrink-0">
                                ({gameCount})
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-mono font-bold text-foreground">
                            {fmt(stats.totalPayout)}
                          </div>
                          <div className={`text-sm font-mono font-bold ${netColor}`}>
                            {stats.net >= 0 ? "+" : ""}{fmt(stats.net)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Paid: {fmt(stats.totalPaid)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={resetGame}>
                <RefreshCw size={14} className="mr-2" />
                Reset Scores
              </Button>
              <Button onClick={saveToArchive} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Archive size={14} className="mr-2" />
                {savedMsg ? "Saved ✓" : "Save to Archive"}
              </Button>
            </div>

            {/* Notes */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground shrink-0">Notes:</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for this session…"
                className="h-9 text-sm"
              />
            </div>
          </TabsContent>

          {/* ── Archive Tab ── */}
          <TabsContent value="archive" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Game History
              </h2>
              {archive.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {archive.length} session{archive.length !== 1 ? "s" : ""} saved
                </span>
              )}
            </div>

            {archive.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Archive size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No games archived yet.</p>
                <p className="text-xs mt-1 text-muted-foreground/60">
                  Click "Save to Archive" on the Today Game tab after a game.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {archive.map((session) => (
                  <ArchiveEntry
                    key={session.id}
                    session={session}
                    onDelete={deleteArchiveEntry}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Players Tab ── */}
          <TabsContent value="players">
            <PlayersTab
              knownPlayers={knownPlayers}
              archive={archive}
              onAdd={addKnownPlayer}
              onDelete={deleteKnownPlayer}
              onRename={renameKnownPlayer}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default CrapsCalculator;
