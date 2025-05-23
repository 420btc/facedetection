'use client';

import { useEffect, useState } from 'react';

interface FaceSession {
  id: number;
  startTime: number;
  endTime: number | null;
  duration: number;
}

interface FaceSessionTrackerProps {
  isFaceDetected: boolean;
}

export default function FaceSessionTracker({ isFaceDetected }: FaceSessionTrackerProps) {
  const [currentSession, setCurrentSession] = useState<{
    startTime: number | null;
    elapsedTime: number;
  }>({ startTime: null, elapsedTime: 0 });
  
  const [sessions, setSessions] = useState<FaceSession[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Handle session tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isFaceDetected) {
      // Start new session if not already running
      if (!isRunning) {
        setCurrentSession({
          startTime: Date.now(),
          elapsedTime: 0,
        });
        setIsRunning(true);
        setLastUpdate(Date.now());
      }

      // Update elapsed time every second
      timer = setInterval(() => {
        const now = Date.now();
        const delta = (now - lastUpdate) / 1000; // in seconds
        setLastUpdate(now);
        
        setCurrentSession(prev => ({
          ...prev,
          elapsedTime: prev.elapsedTime + delta
        }));
      }, 1000);
    } else if (isRunning) {
      // End current session
      const endTime = Date.now();
      const newSession: FaceSession = {
        id: endTime,
        startTime: currentSession.startTime || endTime,
        endTime,
        duration: currentSession.elapsedTime + ((endTime - lastUpdate) / 1000)
      };
      
      setSessions(prev => [newSession, ...prev]);
      setIsRunning(false);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isFaceDetected, isRunning, currentSession.startTime, currentSession.elapsedTime, lastUpdate]);

  // Format time in seconds to HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return [
      h.toString().padStart(2, '0'),
      m.toString().padStart(2, '0'),
      s.toString().padStart(2, '0')
    ].join(':');
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="mt-6 w-full max-w-6xl mx-auto">
      <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 text-white">📊 Sesión de Detección</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">Sesión Actual</h4>
            {isRunning ? (
              <div className="space-y-2">
                <p className="text-2xl font-mono text-green-400">
                  {formatDuration(currentSession.elapsedTime)}
                </p>
                <p className="text-sm text-gray-400">
                  Inició: {formatDateTime(currentSession.startTime || Date.now())}
                </p>
              </div>
            ) : (
              <p className="text-gray-400">No hay sesión activa</p>
            )}
          </div>
          
          <div>
            <h4 className="text-lg font-medium text-gray-300 mb-2">Últimas Sesiones</h4>
            {sessions.length > 0 ? (
              <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                {sessions.slice(0, 3).map(session => (
                  <div key={session.id} className="text-sm p-2 bg-gray-800 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-300">{formatDateTime(session.startTime)}</span>
                      <span className="font-mono text-blue-400">{formatDuration(session.duration)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Finalizó: {session.endTime ? formatDateTime(session.endTime) : 'En curso'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No hay sesiones registradas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
