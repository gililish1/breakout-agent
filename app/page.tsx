'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Page = 'dashboard' | 'trade' | 'journal' | 'coach' | 'pilot';
type Direction = 'Long' | 'Short';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Trade = {
  id: string;
  testerName: string;
  symbol: string;
  direction: Direction;
  entry: string;
  actualExit: string;
  stop: string;
  target: string;
  quantity: string;
  entryTime: string;
  exitTime: string;
  notes: string;
  pnl: number;
  date: string;
};

const palette = {
  bg: '#07111f',
  card: '#0f1b2d',
  softCard: '#13243d',
  border: '#22324a',
  text: '#f1f5f9',
  muted: '#94a3b8',
  green: '#22c77a',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#38bdf8',
};

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: '100vh', color: palette.text, fontFamily: 'Inter, Arial, sans-serif', background: `radial-gradient(circle at top left, rgba(34,199,122,.14), transparent 28%), linear-gradient(135deg, ${palette.bg}, #030712)` },
  layout: { display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' },
  sidebar: { padding: 18, borderRight: `1px solid ${palette.border}`, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(5,12,24,.72)' },
  main: { padding: 22 },
  card: { background: 'rgba(15,27,45,.92)', border: `1px solid ${palette.border}`, borderRadius: 22, padding: 18, boxShadow: '0 18px 50px rgba(0,0,0,.25)' },
  softCard: { background: 'rgba(19,36,61,.72)', border: `1px solid ${palette.border}`, borderRadius: 18, padding: 14 },
  input: { width: '100%', padding: '11px 12px', borderRadius: 12, background: '#081323', color: 'white', border: `1px solid ${palette.border}`, marginTop: 6, boxSizing: 'border-box', outline: 'none' },
  button: { padding: '11px 14px', borderRadius: 12, background: `linear-gradient(135deg, ${palette.green}, #16a34a)`, border: 'none', fontWeight: 800, cursor: 'pointer', color: '#03140b' },
  ghostButton: { padding: '11px 14px', borderRadius: 12, background: 'rgba(15,27,45,.8)', border: `1px solid ${palette.border}`, fontWeight: 800, cursor: 'pointer', color: palette.text },
  label: { fontSize: 13, color: palette.text, fontWeight: 800 },
  helper: { color: palette.muted, fontSize: 12, lineHeight: 1.4, marginTop: 4, marginBottom: 8 },
};

const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (v: number) => `${v < 0 ? '-' : ''}$${Math.abs(v).toFixed(2)}`;
const pct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

function calcPnL(direction: Direction, entry: string, actualExit: string, qty: string) {
  const mult = direction === 'Long' ? 1 : -1;
  return (toNum(actualExit) - toNum(entry)) * mult * toNum(qty);
}

function calcPct(direction: Direction, entry: string, actualExit: string) {
  const entryNum = toNum(entry);
  if (!entryNum) return 0;
  const mult = direction === 'Long' ? 1 : -1;
  return ((toNum(actualExit) - entryNum) / entryNum) * 100 * mult;
}

function calcRiskReward(direction: Direction, entry: string, stop: string, target: string) {
  const entryNum = toNum(entry);
  const stopNum = toNum(stop);
  const targetNum = toNum(target);
  const risk = Math.abs(entryNum - stopNum);
  const reward = direction === 'Long' ? targetNum - entryNum : entryNum - targetNum;
  if (!risk || reward <= 0) return 0;
  return reward / risk;
}

function buildTradingViewUrl(symbol: string) {
  const safeSymbol = symbol.trim().toUpperCase() || 'NVDA';
  return `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(safeSymbol)}&interval=60&theme=dark&style=1&hide_side_toolbar=0&allow_symbol_change=1&save_image=0&details=1&studies=%5B%5D&locale=en`;
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' | 'danger' }) {
  const { variant = 'solid', style, ...rest } = props;
  const base = variant === 'ghost' ? styles.ghostButton : variant === 'danger' ? { ...styles.button, background: palette.red, color: 'white' } : styles.button;
  return <button {...rest} style={{ ...base, ...(style || {}) }} />;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...styles.input, ...(props.style || {}) }} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...styles.card, ...(style || {}) }}>{children}</div>;
}

function Field({ label, helper, children }: { label: string; helper: string; children: React.ReactNode }) {
  return <div><div style={styles.label}>{label}</div><div style={styles.helper}>{helper}</div>{children}</div>;
}

function Stat({ label, value, color = palette.text }: { label: string; value: string; color?: string }) {
  return <div style={styles.softCard}><div style={{ color: palette.muted, fontSize: 12, marginBottom: 6 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div></div>;
}

function VisualTradeChart({ direction, entry, actualExit, stop, target }: { direction: Direction; entry: string; actualExit: string; stop: string; target: string }) {
  const values = [toNum(entry), toNum(actualExit), toNum(stop), toNum(target)].filter((x) => x > 0);
  const fallback = toNum(entry) || 100;
  const min = values.length ? Math.min(...values, fallback - 5) : fallback - 5;
  const max = values.length ? Math.max(...values, fallback + 5) : fallback + 5;
  const range = max - min || 1;
  const y = (price: string) => `${12 + (1 - (toNum(price) - min) / range) * 72}%`;
  const lineColor = calcPnL(direction, entry, actualExit, '1') >= 0 ? palette.green : palette.red;
  const label = (name: string, price: string, color: string, left: string) => !toNum(price) ? null : (
    <React.Fragment key={`${name}-${price}`}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: y(price), borderTop: `1.5px dashed ${color}`, opacity: 0.9 }} />
      <div style={{ position: 'absolute', left, top: `calc(${y(price)} - 15px)`, padding: '6px 9px', borderRadius: 10, background: color, color: color === palette.green ? '#03140b' : 'white', fontSize: 12, fontWeight: 900 }}>{name}: {price}</div>
    </React.Fragment>
  );

  return <div style={{ ...styles.softCard, height: 260, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 18, top: 12, color: palette.muted, fontSize: 12 }}>Visual trade map</div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs><linearGradient id="tradeGradient" x1="0" x2="1"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor={lineColor} /></linearGradient></defs>
      <polyline points="8,70 22,62 34,67 47,48 60,55 73,35 92,42" fill="none" stroke="rgba(148,163,184,.22)" strokeWidth="2" />
      <line x1="18" y1="50" x2="82" y2="50" stroke="url(#tradeGradient)" strokeWidth="3" strokeLinecap="round" />
    </svg>
    {label('Entry', entry, palette.green, '18px')}
    {label('Actual Exit', actualExit, lineColor, 'calc(100% - 150px)')}
    {label('Stop', stop, palette.red, '18px')}
    {label('Target', target, palette.blue, 'calc(100% - 135px)')}
  </div>;
}

function TradingViewPanel({ symbol }: { symbol: string }) {
  const safeSymbol = symbol.trim().toUpperCase() || 'NVDA';
  const url = buildTradingViewUrl(safeSymbol);
  const externalUrl = `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(safeSymbol)}`;
  return <Card>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 12 }}>
      <div><h3 style={{ margin: 0 }}>{safeSymbol} Live Chart</h3><div style={{ color: palette.muted, fontSize: 13 }}>Actual Exit is used for P&L and AI analysis.</div></div>
      <a href={externalUrl} target="_blank" rel="noreferrer" style={{ color: palette.green, fontWeight: 800 }}>Open TradingView</a>
    </div>
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${palette.border}`, background: '#050b16' }}>
      <iframe title={`TradingView ${safeSymbol}`} src={url} style={{ width: '100%', height: 520, border: 'none', display: 'block' }} allowFullScreen />
    </div>
  </Card>;
}

async function analyzeWithAI(trade: Trade, messages: ChatMessage[] = [], userQuestion = ''): Promise<string> {
  try {
    const payload = {
      mode: messages.length ? 'follow_up_chat' : 'initial_trade_analysis',
      trade,
      conversation: messages,
      userQuestion,
      instructions: 'You are an AI trading coach. Analyze the trade using testerName, symbol, direction, entry, actualExit, target, stop, quantity, entryTime, exitTime, notes, and pnl.',
    };
    const response = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) return `AI request failed with status ${response.status}. Check the terminal for the API error.`;
    const data = await response.json();
    return data.result || 'No AI response was returned.';
  } catch {
    return 'Error connecting to AI. Make sure the Next.js server is running and /api/analyze exists.';
  }
}

async function fetchTrades(testerName: string): Promise<Trade[]> {
  const response = await fetch(`/api/trades?testerName=${encodeURIComponent(testerName)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to load trades');
  const data = await response.json();
  return data.trades || [];
}

async function createTrade(trade: Omit<Trade, 'id'>): Promise<Trade> {
  const response = await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trade) });
  if (!response.ok) throw new Error('Failed to save trade');
  const data = await response.json();
  return data.trade;
}

async function updateTrade(trade: Trade): Promise<Trade> {
  const response = await fetch('/api/trades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(trade) });
  if (!response.ok) throw new Error('Failed to update trade');
  const data = await response.json();
  return data.trade;
}

async function deleteTradeFromDb(id: string): Promise<void> {
  const response = await fetch(`/api/trades?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete trade');
}

function getSavedTesterName() {
  if (typeof window === 'undefined') return 'Gilad';
  return window.localStorage.getItem('breakout_agent_tester') || 'Gilad';
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [testerName, setTesterName] = useState('Gilad');
  const [testerDraft, setTesterDraft] = useState('Gilad');
  const [symbol, setSymbol] = useState('NVDA');
  const [direction, setDirection] = useState<Direction>('Long');
  const [entry, setEntry] = useState('100');
  const [actualExit, setActualExit] = useState('110');
  const [stop, setStop] = useState('95');
  const [target, setTarget] = useState('120');
  const [quantity, setQuantity] = useState('10');
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [notes, setNotes] = useState('');
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [tradeError, setTradeError] = useState('');

  const pnl = calcPnL(direction, entry, actualExit, quantity);
  const pnlPercent = calcPct(direction, entry, actualExit);
  const rr = calcRiskReward(direction, entry, stop, target);
  const totalPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winRate = trades.length ? Math.round((trades.filter((trade) => trade.pnl > 0).length / trades.length) * 100) : 0;

  const selectedTradingUrl = useMemo(() => {
    const selectedSymbol = selectedTrade?.symbol || symbol;
    return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(selectedSymbol)}`;
  }, [selectedTrade, symbol]);

  useEffect(() => {
    const savedTester = getSavedTesterName();
    setTesterName(savedTester);
    setTesterDraft(savedTester);
  }, []);

  useEffect(() => {
    loadTrades(testerName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testerName]);

  async function loadTrades(name = testerName) {
    setLoadingTrades(true);
    setTradeError('');
    try {
      const loaded = await fetchTrades(name);
      setTrades(loaded);
      setSelectedTrade(loaded[0] || null);
      setChatMessages([]);
    } catch {
      setTradeError('Could not load trades from DB. Run Prisma migration and restart the server.');
    } finally {
      setLoadingTrades(false);
    }
  }

  function saveTesterName() {
    const clean = testerDraft.trim() || 'Guest';
    setTesterName(clean);
    window.localStorage.setItem('breakout_agent_tester', clean);
    setPage('dashboard');
  }

  function resetTradeForm() {
    setEditingTradeId(null);
    setSymbol('NVDA');
    setDirection('Long');
    setEntry('100');
    setActualExit('110');
    setStop('95');
    setTarget('120');
    setQuantity('10');
    setEntryTime('');
    setExitTime('');
    setNotes('');
  }

  function loadTradeForEdit(trade: Trade) {
    setEditingTradeId(trade.id);
    setTesterName(trade.testerName || testerName);
    setTesterDraft(trade.testerName || testerName);
    setSymbol(trade.symbol);
    setDirection(trade.direction);
    setEntry(trade.entry);
    setActualExit(trade.actualExit);
    setStop(trade.stop);
    setTarget(trade.target);
    setQuantity(trade.quantity);
    setEntryTime(trade.entryTime || '');
    setExitTime(trade.exitTime || '');
    setNotes(trade.notes || '');
    setSelectedTrade(trade);
    setChatMessages([]);
    setPage('trade');
  }

  async function saveTrade() {
    setTradeError('');
    const payload = {
      testerName,
      symbol: symbol.trim().toUpperCase() || 'UNKNOWN',
      direction,
      entry,
      actualExit,
      stop,
      target,
      quantity,
      entryTime,
      exitTime,
      notes,
      pnl,
      date: editingTradeId ? (selectedTrade?.date || new Date().toLocaleString()) : new Date().toLocaleString(),
    };

    try {
      if (editingTradeId) {
        const updated = await updateTrade({ id: editingTradeId, ...payload });
        setTrades((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSelectedTrade(updated);
        setEditingTradeId(null);
      } else {
        const saved = await createTrade(payload);
        setTrades((prev) => [saved, ...prev]);
        setSelectedTrade(saved);
      }
      setChatMessages([]);
      setPage('journal');
    } catch {
      setTradeError(editingTradeId ? 'Could not update trade in DB.' : 'Could not save trade to DB.');
    }
  }

  async function handleDeleteTrade(id: string) {
    setTradeError('');
    try {
      await deleteTradeFromDb(id);
      setTrades((prev) => prev.filter((trade) => trade.id !== id));
      if (selectedTrade?.id === id) {
        setSelectedTrade(null);
        setChatMessages([]);
      }
      if (editingTradeId === id) resetTradeForm();
    } catch {
      setTradeError('Could not delete trade from DB.');
    }
  }

  async function runAI() {
    if (!selectedTrade) return;
    setLoadingAI(true);
    setChatMessages([]);
    const result = await analyzeWithAI(selectedTrade);
    setChatMessages([{ role: 'assistant', content: result }]);
    setLoadingAI(false);
  }

  async function sendChatMessage() {
    if (!selectedTrade || !chatInput.trim()) return;
    const question = chatInput.trim();
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: question }];
    setChatMessages(nextMessages);
    setChatInput('');
    setLoadingChat(true);
    const answer = await analyzeWithAI(selectedTrade, nextMessages, question);
    setChatMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    setLoadingChat(false);
  }

  function selectTrade(trade: Trade) {
    setSelectedTrade(trade);
    setChatMessages([]);
  }

  return (
    <div style={styles.app}>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>Breakout AI</div>
            <div style={{ color: palette.muted, fontSize: 12 }}>V5 · Testers + Edit</div>
          </div>

          <div style={styles.softCard}>
            <div style={{ color: palette.muted, fontSize: 12 }}>Current tester</div>
            <div style={{ fontWeight: 900, color: palette.green }}>{testerName}</div>
          </div>

          <Button variant={page === 'dashboard' ? 'solid' : 'ghost'} onClick={() => setPage('dashboard')}>Dashboard</Button>
          <Button variant={page === 'trade' ? 'solid' : 'ghost'} onClick={() => setPage('trade')}>Trade</Button>
          <Button variant={page === 'journal' ? 'solid' : 'ghost'} onClick={() => setPage('journal')}>Journal</Button>
          <Button variant={page === 'coach' ? 'solid' : 'ghost'} onClick={() => setPage('coach')}>AI Coach</Button>
          <Button variant={page === 'pilot' ? 'solid' : 'ghost'} onClick={() => setPage('pilot')}>Pilot Settings</Button>

          <div style={{ marginTop: 'auto', ...styles.softCard }}>
            <div style={{ color: palette.muted, fontSize: 12 }}>MVP Status</div>
            <div style={{ fontWeight: 900, color: palette.green }}>AI + DB + Testers + Edit</div>
          </div>
        </aside>

        <main style={styles.main}>
          {tradeError && <Card style={{ marginBottom: 14, borderColor: palette.red, color: palette.red }}>{tradeError}</Card>}

          {page === 'dashboard' && (
            <div style={{ display: 'grid', gap: 18 }}>
              <Card>
                <h1 style={{ marginTop: 0 }}>Pilot Dashboard</h1>
                <p style={{ color: palette.muted }}>Tester separation is active. Journal trades can also be loaded into the form and edited.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <Stat label="Tester" value={testerName} color={palette.green} />
                  <Stat label="Total Trades" value={loadingTrades ? 'Loading...' : String(trades.length)} />
                  <Stat label="Total P&L" value={money(totalPnL)} color={totalPnL >= 0 ? palette.green : palette.red} />
                  <Stat label="Win Rate" value={`${winRate}%`} />
                </div>
              </Card>
            </div>
          )}

          {page === 'pilot' && (
            <Card>
              <h2 style={{ marginTop: 0 }}>Pilot Settings</h2>
              <p style={{ color: palette.muted }}>Type a tester name before saving trades. Each tester gets a separate Journal view.</p>
              <Field label="Tester Name" helper="Example: Gilad, Rotem, Dad, Friend 1.">
                <Input value={testerDraft} onChange={(event) => setTesterDraft(event.target.value)} />
              </Field>
              <Button onClick={saveTesterName}>Save Tester</Button>
            </Card>
          )}

          {page === 'trade' && (
            <div style={{ display: 'grid', gridTemplateColumns: '430px 1fr', gap: 18, alignItems: 'start' }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <h2 style={{ marginTop: 0 }}>{editingTradeId ? 'Edit Trade' : 'New Trade'}</h2>
                  {editingTradeId && <Button variant="ghost" onClick={resetTradeForm}>Cancel Edit</Button>}
                </div>
                <p style={{ color: palette.muted }}>
                  {editingTradeId ? 'Editing existing Journal trade. Save will update the DB record.' : <>Saving under tester: <b>{testerName}</b>. Target is planned. Actual Exit is the real close.</>}
                </p>

                <Field label="Symbol / Ticker" helper="The stock symbol, for example NVDA, AAPL, TSLA, AMD."><Input value={symbol} onChange={(event) => setSymbol(event.target.value)} /></Field>
                <Field label="Direction" helper="Choose Long if you bought first, or Short if you sold first.">
                  <select value={direction} onChange={(event) => setDirection(event.target.value as Direction)} style={styles.input}><option value="Long">Long</option><option value="Short">Short</option></select>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Entry Price" helper="The price where you entered."><Input value={entry} onChange={(event) => setEntry(event.target.value)} /></Field>
                  <Field label="Actual Exit Price" helper="The real price where the trade closed."><Input value={actualExit} onChange={(event) => setActualExit(event.target.value)} /></Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Stop Loss" helper="Your planned invalidation price."><Input value={stop} onChange={(event) => setStop(event.target.value)} /></Field>
                  <Field label="Target Price" helper="Your planned profit target."><Input value={target} onChange={(event) => setTarget(event.target.value)} /></Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Entry Date & Time" helper="When the position was opened."><Input type="datetime-local" value={entryTime} onChange={(event) => setEntryTime(event.target.value)} /></Field>
                  <Field label="Exit Date & Time" helper="When the position was closed."><Input type="datetime-local" value={exitTime} onChange={(event) => setExitTime(event.target.value)} /></Field>
                </div>

                <Field label="Quantity" helper="How many shares you traded."><Input value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
                <Field label="Trade Notes" helper="Describe setup, trigger, volume, emotions, mistake, and chart context.">
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...styles.input, minHeight: 120, resize: 'vertical' }} />
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '12px 0' }}>
                  <Stat label="Estimated P&L" value={money(pnl)} color={pnl >= 0 ? palette.green : palette.red} />
                  <Stat label="P&L %" value={pct(pnlPercent)} color={pnl >= 0 ? palette.green : palette.red} />
                  <Stat label="Planned R:R" value={`${rr.toFixed(2)}R`} color={rr >= 2 ? palette.green : palette.amber} />
                  <Stat label="Shares" value={quantity || '0'} />
                </div>

                <Button onClick={saveTrade} style={{ width: '100%', marginTop: 8 }}>{editingTradeId ? 'Update Trade in DB' : 'Save Trade to DB'}</Button>
              </Card>

              <div style={{ display: 'grid', gap: 18 }}>
                <VisualTradeChart direction={direction} entry={entry} actualExit={actualExit} stop={stop} target={target} />
                <TradingViewPanel symbol={symbol} />
              </div>
            </div>
          )}

          {page === 'journal' && (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ marginTop: 0 }}>Journal · {testerName}</h2><Button variant="ghost" onClick={() => loadTrades()}>Refresh DB</Button></div>
              {trades.length === 0 ? <p style={{ color: palette.muted }}>No trades for this tester yet. Add one from the Trade screen.</p> : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {trades.map((trade) => (
                    <div key={trade.id} style={{ ...styles.softCard, background: selectedTrade?.id === trade.id ? '#17345a' : styles.softCard.background }}>
                      <div onClick={() => selectTrade(trade)} style={{ cursor: 'pointer' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><strong>{trade.symbol} · {trade.direction}</strong><span style={{ color: trade.pnl >= 0 ? palette.green : palette.red, fontWeight: 900 }}>{money(trade.pnl)}</span></div>
                        <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>Tester {trade.testerName} · Entry {trade.entry} → Actual Exit {trade.actualExit} · Target {trade.target} · Qty {trade.quantity} · Saved {trade.date}</div>
                        <div style={{ color: palette.muted, fontSize: 12 }}>Time: {trade.entryTime || 'No entry time'} → {trade.exitTime || 'No exit time'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <Button variant="ghost" onClick={(event) => { event.stopPropagation(); loadTradeForEdit(trade); }}>Load/Edit</Button>
                        <Button variant="danger" onClick={(event) => { event.stopPropagation(); handleDeleteTrade(trade.id); }}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {page === 'coach' && (
            <Card>
              <h2 style={{ marginTop: 0 }}>AI Coach</h2>
              {selectedTrade ? (
                <div>
                  <div style={{ ...styles.softCard, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div><strong>{selectedTrade.symbol}</strong> · {selectedTrade.direction} · {selectedTrade.testerName}<div style={{ color: palette.muted, fontSize: 12 }}>Entry {selectedTrade.entry} at {selectedTrade.entryTime || 'unknown time'} → Actual Exit {selectedTrade.actualExit} at {selectedTrade.exitTime || 'unknown time'} · Target {selectedTrade.target}</div></div>
                      <div style={{ color: selectedTrade.pnl >= 0 ? palette.green : palette.red, fontWeight: 900 }}>{money(selectedTrade.pnl)}</div>
                    </div>
                  </div>

                  <Button onClick={runAI} disabled={loadingAI}>{loadingAI ? 'Analyzing...' : 'Analyze Trade'}</Button>
                  <a href={selectedTradingUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 12, color: palette.green, fontWeight: 800 }}>Open chart</a>
                  <Button variant="ghost" onClick={() => loadTradeForEdit(selectedTrade)} style={{ marginLeft: 12 }}>Edit selected trade</Button>

                  {chatMessages.length > 0 && <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>{chatMessages.map((message, index) => (
                    <div key={`${message.role}-${index}`} style={{ ...styles.softCard, justifySelf: message.role === 'user' ? 'end' : 'start', maxWidth: '82%', background: message.role === 'user' ? '#17345a' : styles.softCard.background, whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                      <strong>{message.role === 'user' ? 'You' : 'AI Coach'}:</strong><div style={{ marginTop: 6 }}>{message.content}</div>
                    </div>
                  ))}</div>}

                  {loadingChat && <p style={{ color: palette.muted }}>AI is thinking...</p>}

                  {chatMessages.length > 0 && <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 16 }}>
                    <input value={chatInput} onChange={(event) => setChatInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') sendChatMessage(); }} placeholder="Ask a follow-up question about this trade..." style={{ ...styles.input, marginTop: 0 }} />
                    <Button onClick={sendChatMessage} disabled={loadingChat || !chatInput.trim()}>Send</Button>
                  </div>}
                </div>
              ) : <p style={{ color: palette.muted }}>Select a trade from Journal first.</p>}
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
