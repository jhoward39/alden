import { store } from './store';

export class VapiClient {
  private apiKey: string;
  private activeCalls = new Map<string, any>();

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY || 'demo-key';
  }

  async startCall(callId: string, candidateName: string, phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number. Use format: +1XXXXXXXXXX');
      }

      store.updateCall(callId, { status: 'initiating' });

      // SIMULATION MODE (for testing UI only)
      if (this.apiKey === 'demo-key') {
        // Simulate call flow
        console.log('Simulating call flow...');
        setTimeout(() => {
          store.updateCall(callId, { status: 'in-progress' });
        }, 1000);
        
        setTimeout(() => {
          store.updateCall(callId, {
            status: 'completed',
            endTime: new Date().toISOString(),
            transcript: `AI Recruiter: Hi, I'm calling from Alden. Can I ask you a few questions about your job search?\n\n${candidateName}: Hi, yes I'm interested in hearing more about opportunities.\n\nAI Recruiter: Great! What are you looking for in another role?\n\n${candidateName}: I'm looking for a role where I can work on challenging technical problems and grow my skills.\n\nAI Recruiter: Why are you looking for another role?\n\n${candidateName}: I'm seeking new opportunities for growth and want to work on more innovative projects.\n\nAI Recruiter: What are your salary expectations?\n\n${candidateName}: I'm looking for a competitive salary in the range of $120k to $150k depending on the role.\n\nAI Recruiter: Thank you for your time today. We'll review your responses and get back to you soon.\n\n${candidateName}: Thank you, I appreciate the opportunity!\n\nCall completed successfully. Duration: 3 minutes.`
          });
        }, 5000);
        
        return { success: true };
      }

      // REAL VAPI CALL using REST API
      const response = await fetch('https://api.vapi.ai/call', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistant: {
            name: 'AI Recruiter',
            model: {
              provider: 'openai',
              model: 'gpt-4',
              systemPrompt: `You are a recruiter for Alden startup. Ask these questions:
1. What are you looking for in another role?
2. Why are you looking for another role?
3. What are your salary expectations?

Be polite. End call after all questions or if no response for 3 minutes.`,
              functions: [{
                name: 'endCall',
                description: 'End the call when screening is complete',
                parameters: {
                  type: 'object',
                  properties: {
                    reason: { type: 'string' }
                  },
                  required: ['reason']
                }
              }]
            },
            voice: {
              provider: '11labs',
              voiceId: 'pNInz6obpgDQGcFmaJgB'
            },
            firstMessage: `Hi, I'm calling from Alden. Can I ask you a few questions about your job search?`
          },
          customer: { number: phoneNumber }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start call');
      }

      const callData = await response.json();
      this.activeCalls.set(callId, callData.id);
      store.updateCall(callId, { 
        status: 'in-progress',
        vapiCallId: callData.id
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      store.updateCall(callId, { status: 'failed', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    return /^\+1\d{10}$/.test(phone);
  }
}

export const vapiClient = new VapiClient(); 