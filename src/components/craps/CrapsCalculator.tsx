import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const { chipsValue, potShare, totalPayout, totalPaid, net } = playerStats(
    player,
    buyIn,
    chipValue,
    potSharePerOwner
  );

  const netColor =
    net > 0
      ? "text-emerald-400"
      : net < 0
      ? "text-red-400"
      : "text-zinc-400";

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-3 rounded-lg bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600/70 transition-colors">
      {/* Name */}
      <Input
        value={player.name}
        onChange={(e) => onUpdate(player.id, { name: e.target.value })}
        placeholder="Player name"
        className="bg-zinc-700/50 border-zinc-600 text-white placeholder:text-zinc-500 h-8 text-sm"
      />

      {/* Bought-in toggle */}
      <button
        onClick={() =>
          onUpdate(player.id, { hasBoughtIn: !player.hasBoughtIn })
        }
        className={`px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
          player.hasBoughtIn
            ? "bg-emerald-600 text-white"
            : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
        }`}
        title="Toggle initial buy-in"
      >
        {player.hasBoughtIn ? "Bought In ✓" : "Buy In"}
      </button>

      {/* Rebuy counter */}
      <div className="flex items-center gap-1">
        <button
          onClick={() =>
            onUpdate(player.id, { rebuys: Math.max(0, player.rebuys - 1) })
          }
          className="w-6 h-6 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center transition-colors"
          disabled={player.rebuys === 0}
        >
          <Minus size={10} />
        </button>
        <span className="w-8 text-center text-sm font-mono text-white">
          {player.rebuys}
        </span>
        <button
          onClick={() => onUpdate(player.id, { rebuys: player.rebuys + 1 })}
          className="w-6 h-6 rounded bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center transition-colors"
          title="Rebuy"
        >
          <Plus size={10} />
        </button>
        <span className="text-xs text-zinc-500 ml-0.5">rebuys</span>
      </div>

      {/* Final chips */}
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={player.finalChips === 0 ? "" : player.finalChips}
          onChange={(e) =>
            onUpdate(player.id, {
              finalChips: Math.max(0, parseInt(e.target.value) || 0),
            })
          }
          placeholder="0"
          className="w-20 bg-zinc-700/50 border-zinc-600 text-white h-8 text-sm text-center"
        />
        <span className="text-xs text-zinc-500">chips</span>
      </div>

      {/* Chip cash value */}
      <div className="text-right min-w-[64px]">
        <div className="text-xs text-zinc-500">chips</div>
        <div className="text-sm font-mono text-zinc-200">{fmt(chipsValue)}</div>
      </div>

      {/* Pot share */}
      <div className="text-right min-w-[64px]">
        <div className="text-xs text-zinc-500">pot share</div>
        <div className="text-sm font-mono text-zinc-200">{fmt(potShare)}</div>
      </div>

      {/* Total payout */}
      <div className="text-right min-w-[72px]">
        <div className="text-xs text-zinc-500">payout</div>
        <div className="text-sm font-mono text-white font-semibold">
          {fmt(totalPayout)}
        </div>
        <div className={`text-xs font-mono font-bold ${netColor}`}>
          {net >= 0 ? "+" : ""}
          {fmt(net)}
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(player.id)}
        className="w-7 h-7 rounded bg-zinc-700 hover:bg-red-900/70 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};

// ─── ArchiveEntry ─────────────────────────────────────────────────────────────

const ArchiveEntry: React.FC<{ session: GameSession; onDelete: (id: string) => void }> = ({
  session,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const chipValue = calcChipValue(session.buyIn, session.initialChips);
  const numOwners = calcNumOwners(session.players);
  const potSharePerOwner = numOwners > 0 ? session.pot / numOwners : 0;

  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-700/30 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Dices size={16} className="text-amber-400" />
          <span className="text-sm font-medium text-white">{session.date}</span>
          <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
            {session.players.length} players
          </Badge>
          <Badge variant="outline" className="text-xs border-amber-700/60 text-amber-400">
            Buy-in: {fmt(session.buyIn)}
          </Badge>
          <span className="text-xs text-zinc-500">Pot: {fmt(session.pot)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            className="p-1 rounded hover:bg-red-900/50 text-zinc-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={15} className="text-zinc-400" />
          ) : (
            <ChevronDown size={15} className="text-zinc-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-700/40">
          <div className="mt-3 flex gap-4 text-xs text-zinc-400 mb-3">
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
                  ? "text-emerald-400"
                  : stats.net < 0
                  ? "text-red-400"
                  : "text-zinc-400";
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-zinc-900/50 rounded px-3 py-2"
                >
                  <span className="text-white font-medium w-32 truncate">{p.name || "—"}</span>
                  <span className="text-zinc-400 text-xs">
                    {p.hasBoughtIn ? "✓ bought in" : "no buy-in"}
                    {p.rebuys > 0 ? ` · ${p.rebuys} rebuy${p.rebuys > 1 ? "s" : ""}` : ""}
                  </span>
                  <span className="text-zinc-400 text-xs">{p.finalChips} chips</span>
                  <span className="text-white font-mono">{fmt(stats.totalPayout)}</span>
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
      setPlayers((ps) =>
        ps.map((p) => (p.id === id ? { ...p, ...updates } : p))
      ),
    []
  );

  const removePlayer = useCallback(
    (id: string) => setPlayers((ps) => ps.filter((p) => p.id !== id)),
    []
  );

  const addPlayer = () =>
    setPlayers((ps) => [...ps, newPlayer(`Player ${ps.length + 1}`)]);

  const resetGame = () => {
    setPlayers(players.map((p) => ({ ...p, rebuys: 0, finalChips: 0, hasBoughtIn: false })));
  };

  const saveToArchive = () => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
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
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-green-950/40 to-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Dices size={28} className="text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Craps Night Payout Calculator
            </h1>
            <p className="text-xs text-zinc-400">
              Track buy-ins, rebuys, chip counts & payouts
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="calculator">
          <TabsList className="bg-zinc-800 border border-zinc-700 mb-6">
            <TabsTrigger
              value="calculator"
              className="data-[state=active]:bg-green-800 data-[state=active]:text-white"
            >
              Calculator
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="data-[state=active]:bg-green-800 data-[state=active]:text-white"
            >
              Archive
              {archive.length > 0 && (
                <span className="ml-1.5 bg-amber-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {archive.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Calculator Tab ── */}
          <TabsContent value="calculator" className="space-y-5">

            {/* Settings */}
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Game Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-6 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">Buy-in / Rebuy Amount</Label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400 text-sm">$</span>
                      <Input
                        type="number"
                        value={buyIn}
                        min={1}
                        onChange={(e) =>
                          setBuyIn(Math.max(1, parseFloat(e.target.value) || 1))
                        }
                        className="w-24 bg-zinc-700 border-zinc-600 text-white h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-zinc-400">
                      Starting Chips per Buy-in
                    </Label>
                    <Input
                      type="number"
                      value={initialChips}
                      min={1}
                      onChange={(e) =>
                        setInitialChips(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-24 bg-zinc-700 border-zinc-600 text-white h-9"
                    />
                  </div>

                  {/* Derived info */}
                  <div className="flex gap-5 flex-wrap ml-auto">
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-0.5">Chip Value</div>
                      <div className="text-lg font-mono font-bold text-amber-400">
                        {fmt(chipValue)}
                      </div>
                      <div className="text-xs text-zinc-500">per chip</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-0.5">Total Pot</div>
                      <div className="text-lg font-mono font-bold text-green-400">
                        {fmt(pot)}
                      </div>
                      <div className="text-xs text-zinc-500">{numOwners} owner{numOwners !== 1 ? "s" : ""}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-zinc-500 mb-0.5">Pot / Owner</div>
                      <div className="text-lg font-mono font-bold text-blue-400">
                        {fmt(potSharePerOwner)}
                      </div>
                      <div className="text-xs text-zinc-500">equal share</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <div className="text-xs text-zinc-500 bg-zinc-800/40 border border-zinc-700/40 rounded-lg px-4 py-2.5 flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <strong className="text-zinc-400">Initial buy-in:</strong> ½ → chips · ½ → pot (+ ownership share)
              </span>
              <span>
                <strong className="text-zinc-400">Rebuy:</strong> ½ → chips · ½ → pot (no new ownership)
              </span>
              <span>
                <strong className="text-zinc-400">End of night:</strong> chips × {fmt(chipValue)} + equal pot share
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto_auto] gap-2 px-3 text-xs text-zinc-500 uppercase tracking-wider">
              <span>Player</span>
              <span className="w-[88px] text-center">Buy-in</span>
              <span className="w-[100px] text-center">Rebuys</span>
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
              className="border-dashed border-zinc-600 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-400 w-full"
            >
              <PlusCircle size={15} className="mr-2" />
              Add Player
            </Button>

            {/* Totals summary */}
            {players.length > 0 && (
              <Card className="bg-zinc-800/80 border-zinc-700">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {players.map((p) => {
                      const stats = playerStats(p, buyIn, chipValue, potSharePerOwner);
                      const netColor =
                        stats.net > 0
                          ? "text-emerald-400"
                          : stats.net < 0
                          ? "text-red-400"
                          : "text-zinc-400";
                      return (
                        <div
                          key={p.id}
                          className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-700/40"
                        >
                          <div className="text-sm font-medium text-white truncate mb-1">
                            {p.name || "—"}
                          </div>
                          <div className="text-lg font-mono font-bold text-white">
                            {fmt(stats.totalPayout)}
                          </div>
                          <div className={`text-sm font-mono font-bold ${netColor}`}>
                            {stats.net >= 0 ? "+" : ""}{fmt(stats.net)}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
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
              <Button
                variant="outline"
                onClick={resetGame}
                className="border-zinc-600 bg-transparent text-zinc-400 hover:text-white"
              >
                <RefreshCw size={14} className="mr-2" />
                Reset Scores
              </Button>
              <Button
                onClick={saveToArchive}
                className="bg-green-700 hover:bg-green-600 text-white"
              >
                <Archive size={14} className="mr-2" />
                {savedMsg ? "Saved ✓" : "Save to Archive"}
              </Button>
            </div>
          </TabsContent>

          {/* ── Archive Tab ── */}
          <TabsContent value="archive" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                Game History
              </h2>
              {archive.length > 0 && (
                <span className="text-xs text-zinc-500">
                  {archive.length} session{archive.length !== 1 ? "s" : ""} saved
                </span>
              )}
            </div>

            {archive.length === 0 ? (
              <div className="text-center py-16 text-zinc-600">
                <Archive size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No games archived yet.</p>
                <p className="text-xs mt-1">
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
