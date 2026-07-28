import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, Volume2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function VoiceCallSimulatorModal({ onClose, onSubmitTicket }) {
  const [callState, setCallState] = useState('IDLE'); // IDLE, CONNECTING, ACTIVE, ENDED
  const [timerSec, setTimerSec] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

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

  const startCall = () => {
    setCallState('CONNECTING');
    setTimeout(() => {
      setCallState('ACTIVE');
      setTranscript([
        { sender: 'AI Agent', text: 'Hello! Welcome to SentinelDesk Voice Support. How can I help you today?' },
      ]);
      // Simulate real-time conversation
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          { sender: 'Customer', text: 'Hi, I got billed twice for my pro subscription yesterday.' },
        ]);
      }, 3000);
      setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          { sender: 'AI Agent', text: 'I understand! I can see your duplicate invoice for $49.00. I am initiating an automated refund now.' },
        ]);
      }, 6000);
    }, 1500);
  };

  const endCall = () => {
    setCallState('ENDED');
  };

  const handleCreateTicketFromVoice = () => {
    if (onSubmitTicket) {
      onSubmitTicket({
        subject: 'Voice Call Triage: Duplicate Charge Invoice',
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
        padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ background: '#eff6ff', color: '#2563eb', padding: 6, borderRadius: 8 }}>
              <Phone size={18} />
            </span>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>WebRTC Real-Time Voice Simulator</h3>
              <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>SentinelDesk AI Voice Triage Bridge</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Call Box */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 20, textAlign: 'center', marginBottom: 16
        }}>
          {callState === 'IDLE' && (
            <div>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Volume2 size={28} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Ready for Voice Triage</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 16px' }}>Click start to initiate simulated WebRTC stream</p>
              <button onClick={startCall} style={{
                background: '#10b981', color: '#fff', border: 'none', borderRadius: 999,
                padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
              }}>
                <Phone size={16} /> Start Voice Stream
              </button>
            </div>
          )}

          {callState === 'CONNECTING' && (
            <div style={{ padding: '12px 0' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 12px', animation: 'ping 1s infinite' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', margin: 0 }}>Connecting WebSocket Bridge...</p>
            </div>
          )}

          {callState === 'ACTIVE' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{formatTimer(timerSec)}</span>
              </div>
              <p style={{ fontSize: 11, color: '#10b981', fontWeight: 600, margin: '0 0 16px' }}>● Live WebRTC Stream Connected</p>
              
              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button onClick={() => setIsMuted(!isMuted)} style={{
                  background: isMuted ? '#fecaca' : '#e2e8f0', color: isMuted ? '#ef4444' : '#475569',
                  border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <Mic size={18} />
                </button>
                <button onClick={endCall} style={{
                  background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%',
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }}>
                  <PhoneOff size={18} />
                </button>
              </div>
            </div>
          )}

          {callState === 'ENDED' && (
            <div>
              <div style={{ color: '#10b981', margin: '0 auto 8px', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle2 size={36} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Voice Call Transcribed</p>
              <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px' }}>Total Call Duration: {formatTimer(timerSec)}</p>
              <button onClick={handleCreateTicketFromVoice} style={{
                background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}>
                Submit Transcribed Ticket to Triage
              </button>
            </div>
          )}
        </div>

        {/* Live Transcript Stream */}
        {transcript.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Real-Time STT Transcript</p>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, maxHeight: 140, overflowY: 'auto' }}>
              {transcript.map((t, idx) => (
                <div key={idx} style={{ marginBottom: 6, fontSize: 11 }}>
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
