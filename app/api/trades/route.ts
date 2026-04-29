import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const testerName = searchParams.get('testerName') || undefined;

  const trades = await prisma.trade.findMany({
    where: testerName ? { testerName } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ trades });
}

export async function POST(req: Request) {
  const body = await req.json();

  const trade = await prisma.trade.create({
    data: {
      testerName: String(body.testerName || 'Guest'),
      symbol: String(body.symbol || 'UNKNOWN'),
      direction: String(body.direction || 'Long'),
      entry: String(body.entry || ''),
      actualExit: String(body.actualExit || ''),
      stop: String(body.stop || ''),
      target: String(body.target || ''),
      quantity: String(body.quantity || ''),
      entryTime: String(body.entryTime || ''),
      exitTime: String(body.exitTime || ''),
      notes: String(body.notes || ''),
      pnl: Number(body.pnl || 0),
      date: String(body.date || new Date().toLocaleString()),
    },
  });

  return NextResponse.json({ trade });
}

export async function PUT(req: Request) {
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Missing trade id' }, { status: 400 });
  }

  const trade = await prisma.trade.update({
    where: { id: String(body.id) },
    data: {
      testerName: String(body.testerName || 'Guest'),
      symbol: String(body.symbol || 'UNKNOWN'),
      direction: String(body.direction || 'Long'),
      entry: String(body.entry || ''),
      actualExit: String(body.actualExit || ''),
      stop: String(body.stop || ''),
      target: String(body.target || ''),
      quantity: String(body.quantity || ''),
      entryTime: String(body.entryTime || ''),
      exitTime: String(body.exitTime || ''),
      notes: String(body.notes || ''),
      pnl: Number(body.pnl || 0),
      date: String(body.date || new Date().toLocaleString()),
    },
  });

  return NextResponse.json({ trade });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing trade id' }, { status: 400 });
  }

  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
