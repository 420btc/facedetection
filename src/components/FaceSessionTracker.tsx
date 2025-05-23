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
  
  // Load sessions from localStorage on component mount
  const [sessions, setSessions] = useState<FaceSession[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('faceDetectionSessions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  // Clear all sessions
  const clearSessions = (): void => {
    if (typeof window !== 'undefined') {
      if (confirm('¿Estás seguro de que quieres borrar todo el historial de sesiones?')) {
        localStorage.removeItem('faceDetectionSessions');
        setSessions([]);
      }
    }
  };

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('faceDetectionSessions', JSON.stringify(sessions));
    }
  }, [sessions]);

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
      
      // Prevent duplicate sessions
      setSessions(prev => {
        // Check if a session with this ID already exists
        const sessionExists = prev.some(session => 
          session.id === newSession.id || 
          (session.startTime === newSession.startTime && session.endTime === newSession.endTime)
        );
        
        if (sessionExists) {
          return prev; // Skip adding if duplicate exists
        }
        
        return [newSession, ...prev];
      });
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

  const formatTimeWithAMPM = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = Math.floor(date.getMilliseconds() / 10).toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    
    return `${hours}:${minutes}:${seconds}.${milliseconds} ${ampm}`;
  };
  
  // Alias para mantener compatibilidad
  const formatDateTime = formatTimeWithAMPM;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700 h-full">
        <h3 className="text-2xl font-semibold text-white mb-4">📊 Sesión Activa</h3>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-gray-400">Tiempo actual:</p>
            {isRunning ? (
              <div className="space-y-1">
                <p className="text-2xl font-mono text-green-400 font-medium">
                  {formatDuration(currentSession.elapsedTime)}
                </p>
                <p className="text-xs text-gray-400">
                  Inició: {formatDateTime(currentSession.startTime || Date.now())}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Inactivo</p>
            )}
          </div>
          
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-300">Historial de Sesiones</h4>
              {sessions.length > 0 && (
                <button 
                  onClick={clearSessions}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                  title="Borrar historial"
                >
                  Borrar todo
                </button>
              )}
            </div>
            {sessions.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {sessions.map((session, index) => (
                  <div key={session.id} className="text-xs p-3 bg-gray-800 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Duración:</span>
                      <span className="text-white font-medium">{formatDuration(session.duration)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-green-400 text-xs">
                          ▲
                        </span>
                        <span className="text-gray-400 ml-1 text-xs">Inicio:</span>
                      </div>
                      <span className="text-white text-xs">{formatDateTime(session.startTime)}</span>
                    </div>
                    {session.endTime && (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-red-400 text-xs">
                            ▼
                          </span>
                          <span className="text-gray-400 ml-1 text-xs">Fin:</span>
                        </div>
                        <span className="text-white text-xs">{formatDateTime(session.endTime)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">Sin registros</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
