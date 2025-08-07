import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  return NextResponse.json({
    calls: store.getAllCalls(),
    logs: store.getLogs()
  });
} 