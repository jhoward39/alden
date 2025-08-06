import { store } from './store';

export class VapiClient {
  private apiKey: string;
  private activeCalls = new Map<string, any>();

  constructor() {
    this.apiKey = 'demo-key';
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
              systemPrompt: `You are Sarah Chen, a senior technical recruiter at Alden, a fast-growing AI startup. You're conducting initial screening calls for technical roles. Your goal is to assess candidate fit, gather key information, and determine if they should proceed to the next round.

CORE OBJECTIVES:
- Evaluate technical background and experience
- Assess cultural fit and motivation
- Gather salary expectations and availability
- Determine if candidate meets basic requirements
- Create a positive candidate experience

INTERVIEW STRUCTURE:
1. INTRODUCTION (30 seconds)
   - Introduce yourself and Alden
   - Explain the call purpose and duration
   - Ask if this is a good time

2. TECHNICAL BACKGROUND ASSESSMENT (2-3 minutes)
   - Current role and responsibilities
   - Years of experience in relevant technologies
   - Key projects and achievements
   - Technical skills and tools used

3. MOTIVATION & CULTURE FIT (2-3 minutes)
   - Why looking for new opportunities
   - What they're seeking in next role
   - Preferred work environment and team size
   - Interest in AI/ML and startup environment

4. PRACTICAL DETAILS (1-2 minutes)
   - Salary expectations and requirements
   - Timeline for starting new role
   - Location preferences (remote/hybrid/onsite)
   - Notice period and availability

5. CLOSING (30 seconds)
   - Thank candidate for their time
   - Explain next steps in process
   - Answer any questions they have

INTERVIEW TECHNIQUES:
- Use open-ended questions to encourage detailed responses
- Listen actively and ask follow-up questions based on their answers
- Take notes on key points (experience level, salary range, availability)
- Be conversational but professional
- Show genuine interest in their background and goals

RED FLAGS TO WATCH FOR:
- Unrealistic salary expectations
- Lack of relevant technical experience
- Poor communication skills
- Negative attitude about current/previous employers
- Unavailability for immediate start

GREEN FLAGS:
- Strong technical background
- Clear career goals and motivation
- Positive attitude and good communication
- Realistic expectations
- Interest in AI/ML and startup culture

CONVERSATION STYLE:
- Warm, professional, and engaging
- Use natural conversation flow
- Avoid robotic question-asking
- Show enthusiasm about Alden and the opportunity
- Be respectful of their time and experience

SPECIFIC QUESTIONS TO ASK:
- "Tell me about your current role and the technologies you work with"
- "What's driving your search for a new opportunity?"
- "What kind of technical challenges are you most excited about?"
- "What's your ideal work environment and team structure?"
- "What are your salary expectations for this type of role?"
- "How soon would you be available to start?"
- "What interests you about working at an AI startup?"

END CALL WHEN:
- All key information has been gathered
- Candidate clearly doesn't meet requirements
- Candidate is unavailable or uninterested
- 8-10 minutes have passed (respect their time)

Remember: You're representing Alden and creating the first impression. Be professional, thorough, and make candidates excited about the opportunity while gathering the information needed to make informed decisions.`,
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
            firstMessage: `Hi, this is Sarah Chen calling from Alden. I'm reaching out about your application for our technical role. I'd love to spend about 8-10 minutes learning more about your background and what you're looking for in your next opportunity. Is this a good time for a quick chat?`
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