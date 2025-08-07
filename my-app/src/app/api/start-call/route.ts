import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { vapiClient } from '@/lib/vapiClient';

export async function POST(request: NextRequest) {
  try {
    const { candidateName, phoneNumber } = await request.json();

    if (!candidateName || !phoneNumber) {
      return NextResponse.json(
        { error: 'Candidate name and phone number required' },
        { status: 400 }
      );
    }

    const call = store.addCall(candidateName, phoneNumber);
    vapiClient.startCall(call.id, candidateName, phoneNumber);

    return NextResponse.json({ success: true, callId: call.id });
  } catch (error) {
    console.error('Start call error:', error);
    return NextResponse.json(
      { error: 'Failed to start call' },
      { status: 500 }
    );
  }
} 