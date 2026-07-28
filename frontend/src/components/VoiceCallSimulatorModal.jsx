import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, Volume2, Send, CheckCircle2 } from 'lucide-react';

export default function VoiceCallSimulatorModal({ onClose, onSubmitTicket }) {
  const [callState, setCallState] = useState('IDLE'); // IDLE, CONNECTING, ACTIVE, ENDED
  const [timerSec, setTimerSec] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (callState === 'ACTIVE') {
      interval = setInterval(() => {
        setTimerSec((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Setup Web Speech API for real mic listening
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          handleUserSpeech(finalTranscript.trim());
        }
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startCall = () => {
    setCallState('CONNECTING');
    setTimeout(() => {
      setCallState('ACTIVE');
      setTranscript([
        { sender: 'AI Agent', text: 'Hello! Welcome to SentinelDesk Voice Support. Please speak into your mic or type your query below.' },
      ]);
      // Start browser microphone recognition if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Mic start err:', e);
        }
      }
    }, 1200);
  };

  const endCall = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setCallState('ENDED');
  };

  const handleUserSpeech = (userText) => {
    if (!userText) return;
    setTranscript((prev) => [
      ...prev,
      { sender: 'Customer', text: userText },
    ]);

    // Intelligent automated response based on user's query
    setTimeout(() => {
      let aiResponse = 'I have received your voice query and escalated it to our 16-node autonomous triage engine.';
      const lower = userText.lower ? userText.lower() : userText.toLowerCase();

      if (lower.includes('billing') || lower.includes('charge') || lower.includes('refund') || lower.includes('invoice')) {
        aiResponse = 'I understand your billing concern. I am checking your account history and preparing an automated refund draft.';
      } else if (lower.includes('api') || lower.includes('500') || lower.includes('error') || lower.includes('crash')) {
        aiResponse = 'I have detected an API technical error. Tracing logs and attaching diagnostic telemetry to your ticket.';
      } else if (lower.includes('password') || lower.includes('login') || lower.includes('auth')) {
        aiResponse = 'I can help with authentication. Generating a secure 2FA password reset link for your account.';
      }

      setTranscript((prev) => [
        ...prev,
        { sender: 'AI Agent', text: aiResponse },
      ]);
    }, 1000);
  };

  const handleSendTextQuery = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    handleUserSpeech(userInput.trim());
    setUserInput('');
  };

  const handleCreateTicketFromVoice = () => {
    if (onSubmitTicket) {
      const customerQueries = transcript.filter((t) => t.sender === 'Customer').map((t) => t.text);
      const subjectText = customerQueries.length > 0 ? customerQueries[0] : 'Voice Support Query';

      onSubmitTicket({
        subject: `Voice Triage: ${subjectText.substring(0, 60)}`,
        body: transcript.map((t) => `${t.sender}: ${t.text}`).join('\n'),
        channel: 'voice_webrtc',
        customer_name: 'Voice Customer',
      });
    }
    onClose();
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
        padding: 24, width: '100%', maxWidth: 520, boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', padding: 6, borderRadius: 8 }}>
              <Phone size={18} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>WebRTC Live Voice & STT Triage</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Speak into mic or type your query in real-time</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Call Status Box */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 20, textAlign: 'center', marginBottom: 16
        }}>
          {callState === 'IDLE' && (
            <div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Volume2 size={28} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Ready to Take Your Query</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px' }}>Connect microphone stream to speak live query</p>
              <button onClick={startCall} style={{
                background: '#10b981', color: '#fff', border: 'none', borderRadius: 999,
                padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}>
                <Phone size={16} /> Start Live Mic Call
              </button>
            </div>
          )}

          {callState === 'CONNECTING' && (
            <div style={{ padding: '12px 0' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 12px', animation: 'ping 1s infinite' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', margin: 0 }}>Connecting Live WebRTC Stream...</p>
            </div>
          )}

          {callState === 'ACTIVE' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{formatTimer(timerSec)}</span>
              </div>
              <p style={{ fontSize: 11, color: isListening ? '#10b981' : '#f59e0b', fontWeight: 600, margin: '0 0 16px' }}>
                {isListening ? '🎙️ Mic Active — Speak your query now' : '● Connected — Type or speak your query'}
              </p>
              
              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                <button
                  onClick={() => {
                    if (recognitionRef.current) {
                      if (isListening) {
                        recognitionRef.current.stop();
                        setIsListening(false);
                      } else {
                        recognitionRef.current.start();
                        setIsListening(true);
                      }
                    }
                  }}
                  style={{
                    background: isListening ? '#dcfce7' : '#f1f5f9',
                    color: isListening ? '#15803d' : '#64748b',
                    border: '1px solid #cbd5e1', borderRadius: '50%', width: 44, height: 44,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                  }}
                  title={isListening ? 'Mute Mic' : 'Unmute Mic'}
                >
                  <Mic size={18} />
                </button>
                <button onClick={endCall} style={{
                  background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%',
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }} title="End Call">
                  <PhoneOff size={18} />
                </button>
              </div>

              {/* Text Input Fallback / Input form */}
              <form onSubmit={handleSendTextQuery} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Or type your voice query here..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #cbd5e1', fontSize: 12, outline: 'none'
                  }}
                />
                <button type="submit" style={{
                  background: '#2563eb', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700
                }}>
                  <Send size={13} /> Speak
                </button>
              </form>
            </div>
          )}

          {callState === 'ENDED' && (
            <div>
              <div style={{ color: '#10b981', margin: '0 auto 8px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle2 size={36} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Voice Call Transcribed</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 14px' }}>Total Call Duration: {formatTimer(timerSec)}</p>
              <button onClick={handleCreateTicketFromVoice} style={{
                background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}>
                Submit Custom Voice Ticket to Triage Engine
              </button>
            </div>
          )}
        </div>

        {/* Live Transcript Stream */}
        {transcript.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Real-Time STT Transcript</p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, maxHeight: 150, overflowY: 'auto' }}>
              {transcript.map((t, idx) => (
                <div key={idx} style={{ marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: t.sender === 'AI Agent' ? '#2563eb' : '#0f172a' }}>{t.sender}: </span>
                  <span style={{ color: '#334155' }}>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
