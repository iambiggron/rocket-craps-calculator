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
  Sun,
  Moon,
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

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
  onUpdate: (id: string, updates: Partial<Player>) => void;
  onRemove: (id: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  buyIn,
  chipValue,
  potSharePerOwner,
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

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-3 rounded-lg bg-card border border-border hover:border-ring/40 transition-colors">
      {/* Name */}
      <Input
        value={player.name}
        onChange={(e) => onUpdate(player.id, { name: e.target.value })}
        placeholder="Player name"
        className="h-8 text-sm"
      />

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

      {/* Final chips */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={player.finalChips === 0 ? "" : player.finalChips}
          onChange={(e) =>
            onUpdate(player.id, { finalChips: Math.max(0, parseInt(e.target.value) || 0) })
          }
          placeholder="0"
          className="w-20 h-8 text-sm text-center"
        />
        <span className="text-xs text-muted-foreground">chips</span>
      </div>

      {/* Chip cash value */}
      <div className="text-right min-w-[64px]">
        <div className="text-xs text-muted-foreground">chips</div>
        <div className="text-sm font-mono text-foreground">{fmt(chipsValue)}</div>
      </div>

      {/* Pot share */}
      <div className="text-right min-w-[64px]">
        <div className="text-xs text-muted-foreground">pot share</div>
        <div className="text-sm font-mono text-foreground">{fmt(potShare)}</div>
      </div>

      {/* Total payout + net */}
      <div className="text-right min-w-[72px]">
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
          <span className="text-xs text-muted-foreground">Pot: {fmt(session.pot)}</span>
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
            <span>Chip value: {fmt(chipValue)}/chip</span>
            <span>Pot: {fmt(session.pot)}</span>
            <span>Owners: {numOwners}</span>
            <span>Pot/owner: {fmt(potSharePerOwner)}</span>
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

// ─── Main Calculator ──────────────────────────────────────────────────────────

const ARCHIVE_KEY = "craps_archive";

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

const CrapsCalculator: React.FC = () => {
  const [buyIn, setBuyIn] = useState(25);
  const [initialChips, setInitialChips] = useState(500);
  const [players, setPlayers] = useState<Player[]>([
    newPlayer("Player 1"),
    newPlayer("Player 2"),
  ]);
  const [archive, setArchive] = useState<GameSession[]>(loadArchive);
  const [savedMsg, setSavedMsg] = useState(false);

  const chipValue = calcChipValue(buyIn, initialChips);
  const pot = calcPot(players, buyIn);
  const numOwners = calcNumOwners(players);
  const potSharePerOwner = numOwners > 0 ? pot / numOwners : 0;

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
    setPlayers((ps) => [...ps, newPlayer(`Player ${ps.length + 1}`)]);

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
    };
    const updated = [session, ...archive];
    setArchive(updated);
    saveArchive(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const deleteArchiveEntry = (id: string) => {
    const updated = archive.filter((s) => s.id !== id);
    setArchive(updated);
    saveArchive(updated);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Dices size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Craps Night Payout Calculator
              </h1>
              <p className="text-xs text-muted-foreground">
                Track buy-ins, rebuys, chip counts &amp; payouts
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="calculator">
          <TabsList className="mb-6">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="archive">
              Archive
              {archive.length > 0 && (
                <span className="ml-1.5 bg-accent text-accent-foreground text-xs rounded-full px-1.5 py-0.5 leading-none font-semibold">
                  {archive.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Calculator Tab ── */}
          <TabsContent value="calculator" className="space-y-5">

            {/* Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 items-end">
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
                      <div className="text-lg font-mono font-bold text-accent">{fmt(chipValue)}</div>
                      <div className="text-xs text-muted-foreground">per chip</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Total Pot</div>
                      <div className="text-lg font-mono font-bold text-emerald-500">{fmt(pot)}</div>
                      <div className="text-xs text-muted-foreground">
                        {numOwners} owner{numOwners !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-0.5">Pot / Owner</div>
                      <div className="text-lg font-mono font-bold text-primary">{fmt(potSharePerOwner)}</div>
                      <div className="text-xs text-muted-foreground">equal share</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <strong className="text-foreground">Initial buy-in:</strong> ½ → chips · ½ → pot (+ ownership share)
              </span>
              <span>
                <strong className="text-foreground">Rebuy (+):</strong> ½ → chips · ½ → pot (no new ownership)
              </span>
              <span>
                <strong className="text-foreground">End of night:</strong> chips × {fmt(chipValue)} + equal pot share
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 px-3 text-xs text-muted-foreground uppercase tracking-wider">
              <span>Player</span>
              <span className="w-[88px] text-center">Buy-in</span>
              <span className="w-[108px] text-center">Rebuys</span>
              <span className="w-[100px] text-center">Final Chips</span>
              <span className="w-[64px] text-right">Chips $</span>
              <span className="w-[64px] text-right">Pot $</span>
              <span className="w-[72px] text-right">Payout / Net</span>
              <span className="w-7" />
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

            {/* Summary cards */}
            {players.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Payout Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {players.map((p) => {
                      const stats = playerStats(p, buyIn, chipValue, potSharePerOwner);
                      const netColor =
                        stats.net > 0
                          ? "text-emerald-500"
                          : stats.net < 0
                          ? "text-destructive"
                          : "text-muted-foreground";
                      return (
                        <div
                          key={p.id}
                          className="bg-muted/40 rounded-lg p-3 border border-border"
                        >
                          <div className="text-sm font-semibold text-foreground truncate mb-1">
                            {p.name || "—"}
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
                  Click "Save to Archive" on the Calculator tab after a game.
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
        </Tabs>
      </div>
    </div>
  );
};

export default CrapsCalculator;
