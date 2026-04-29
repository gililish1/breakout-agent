'use client';
import React, { useState } from 'react';

// ===== Types =====
type Page = 'dashboard' | 'trade' | 'journal' | 'coach';
type Direction = 'Long' | 'Short';

type Trade = {
  id: string;
  symbol: string;
  direction: Direction;
  entry: string;
  exit: string;
  quantity: string;
  notes: string;
  pnl: number;
  date: string;
};

// ===== Theme =====
const palette = {
  bg: '#07111f',
  card: '#0f1b2d',
  border: '#22324a',
  text: '#f1f5f9',
  muted: '#94a3b8',
  green: '#22c77a',
  red: '#ef4444',
};

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: '100vh', color: palette.text, fontFamily: 'Inter', background: palette.bg },
  layout: { display: 'grid', gridTemplateColumns: '240px 1fr' },
  sidebar: { padding: 16, borderRight: `1px solid ${palette.border}`, display: 'flex', flexDirection: 'column', gap: 10 },
  main: { padding: 20 },
  card: { background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 16, padding: 16 },
  input: { width: '100%', padding: 10, borderRadius: 10, background: '#081323', color: 'white', border: `1px solid ${palette.border}`, marginBottom: 10 },
  button: { padding: 10, borderRadius: 10, background: palette.green, border: 'none', fontWeight: 700, cursor: 'pointer' }
};

// ===== Utils =====
const toNum = (v: any) => Number(v) || 0;
const money = (v: number) => `$${v.toFixed(2)}`;

function calcPnL(direction: Direction, entry: string, exit: string, qty: string) {
  const mult = direction === 'Long' ? 1 : -1;
  return (toNum(exit) - toNum(entry)) * mult * toNum(qty);
}

// ===== Components =====
const Input = (p: any) => <input {...p} style={styles.input} />;
const Button = (p: any) => <button {...p} style={styles.button} />;
const Card = ({ children }: any) => <div style={styles.card}>{children}</div>;

// ===== AI API call =====
async function analyzeWithAI(trade: Trade): Promise<string> {
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trade),
    });

    if (!res.ok) {
      return `AI request failed with status ${res.status}. Check the terminal for the API error.`;
    }

    const data = await res.json();
    return data.result || 'No AI response was returned.';
  } catch (err) {
    return 'Error connecting to AI. Make sure the Next.js server is running and /api/analyze exists.';
  }
}

// ===== App =====
export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [symbol, setSymbol] = useState('NVDA');
  const [direction, setDirection] = useState<Direction>('Long');
  const [entry, setEntry] = useState('100');
  const [exit, setExit] = useState('110');
  const [quantity, setQuantity] = useState('10');
  const [notes, setNotes] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const pnl = calcPnL(direction, entry, exit, quantity);

  function saveTrade() {
    const trade: Trade = {
      id: Date.now().toString(),
      symbol,
      direction,
      entry,
      exit,
      quantity,
      notes,
      pnl,
      date: new Date().toLocaleString()
    };
    setTrades([trade, ...trades]);
  }

  async function runAI() {
    if (!selectedTrade) return;
    setLoadingAI(true);
    const result = await analyzeWithAI(selectedTrade);
    setAiResponse(result);
    setLoadingAI(false);
  }

  return (
    <div style={styles.app}>
      <div style={styles.layout}>

        <aside style={styles.sidebar}>
          <h2>Breakout AI</h2>
          <Button onClick={() => setPage('dashboard')}>Dashboard</Button>
          <Button onClick={() => setPage('trade')}>Trade</Button>
          <Button onClick={() => setPage('journal')}>Journal</Button>
          <Button onClick={() => setPage('coach')}>AI Coach</Button>
        </aside>

        <main style={styles.main}>

          {page === 'dashboard' && (
            <Card>
              <h2>Overview</h2>
              <p>Total Trades: {trades.length}</p>
              <p>Total PnL: {money(trades.reduce((a, t) => a + t.pnl, 0))}</p>
            </Card>
          )}

          {page === 'trade' && (
            <Card>
              <h2>New Trade</h2>
              <Input value={symbol} onChange={(e:any)=>setSymbol(e.target.value)} />
              <select value={direction} onChange={(e:any)=>setDirection(e.target.value)} style={styles.input}>
                <option>Long</option>
                <option>Short</option>
              </select>
              <Input value={entry} onChange={(e:any)=>setEntry(e.target.value)} />
              <Input value={exit} onChange={(e:any)=>setExit(e.target.value)} />
              <Input value={quantity} onChange={(e:any)=>setQuantity(e.target.value)} />
              <textarea value={notes} onChange={(e:any)=>setNotes(e.target.value)} style={styles.input} />
              <h3>PnL: {money(pnl)}</h3>
              <Button onClick={saveTrade}>Save Trade</Button>
            </Card>
          )}

          {page === 'journal' && (
            <Card>
              <h2>Journal</h2>
              {trades.map(t => (
                <div key={t.id} style={{borderBottom:'1px solid #333', padding:8, cursor:'pointer'}} onClick={()=>setSelectedTrade(t)}>
                  {t.symbol} | {money(t.pnl)}
                </div>
              ))}
            </Card>
          )}

          {page === 'coach' && (
            <Card>
              <h2>AI Coach</h2>

              {selectedTrade ? (
                <>
                  <p><b>{selectedTrade.symbol}</b></p>
                  <Button onClick={runAI}>Analyze Trade</Button>

                  {loadingAI && <p>Analyzing...</p>}

                  {aiResponse && (
                    <div style={{marginTop:10, whiteSpace:'pre-line'}}>
                      {aiResponse}
                    </div>
                  )}
                </>
              ) : (
                <p>Select a trade from Journal</p>
              )}

            </Card>
          )}

        </main>
      </div>
    </div>
  );
}
