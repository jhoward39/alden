'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Call } from '@/types';

export default function OperatorConsole() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [formData, setFormData] = useState({ candidateName: '', phoneNumber: '' });
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');

  // Phone number validation function
  const isValidPhoneNumber = (phone: string): boolean => {
    return /^\+1\d{10}$/.test(phone);
  };

  // Handle phone number input change with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    setFormData({ ...formData, phoneNumber });
    
    // Clear error if field is empty (user is typing)
    if (!phoneNumber) {
      setPhoneError('');
      return;
    }
    
    // Validate phone number format
    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError('Phone number must be in format: +1XXXXXXXXXX');
    } else {
      setPhoneError('');
    }
  };

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/calls');
      const data = await response.json();
      setCalls(data.calls);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    }
  };

  const startCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submission
    if (!isValidPhoneNumber(formData.phoneNumber)) {
      setPhoneError('Phone number must be in format: +1XXXXXXXXXX');
      return;
    }
    
    setIsStartingCall(true);

    try {
      const response = await fetch('/api/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ candidateName: '', phoneNumber: '' });
        setPhoneError(''); // Clear any previous errors
        setTimeout(fetchCalls, 1000);
      } else {
        const error = await response.json();
        alert(`Failed to start call: ${error.error}`);
      }
    } catch (error) {
      alert('Network error - check console for details');
    } finally {
      setIsStartingCall(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    const interval = setInterval(fetchCalls, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">AI Phone Screen Console</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Start Call Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Start New Call</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={startCall} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Candidate Name</label>
                <Input
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="+15551234567"
                  required
                  className={phoneError ? 'border-red-500' : ''}
                />
                {phoneError ? (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Format: +1XXXXXXXXXX</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isStartingCall || !!phoneError || !formData.candidateName || !formData.phoneNumber}
              >
                {isStartingCall ? 'Starting...' : 'Start Call'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Calls List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-96">
              {calls.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No calls yet. Start a call to see history.</p>
              ) : (
                <ul className="space-y-4">
                  {calls.map((call) => (
                    <li key={call.id} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-gray-600 font-semibold">{call.candidateName}</h3>
                          <p className="text-sm text-gray-600">
                            <Phone className="inline-block mr-1 w-4 h-4" /> {call.phoneNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Clock className="inline-block mr-1 w-4 h-4" /> {new Date(call.startTime).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              call.status === 'completed' ? 'default' : 
                              call.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {call.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {call.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                            {call.status}
                          </Badge>
                          {call.transcript && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTranscript(call.transcript || '')}
                            >
                              View Transcript
                            </Button>
                          )}
                        </div>
                      </div>
                      {call.error && (
                        <p className="text-sm text-red-600 mt-2">Error: {call.error}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transcript Dialog */}
      {selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Call Transcript</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTranscript('')}
              >
                Close
              </Button>
            </div>
            <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
              {selectedTranscript}
            </div>
          </div>
                 </div>
       )}
     </div>
   );
 } 