'use client';

import { useState } from 'react';
import { FaceSession } from './FaceSessionTracker';

interface SessionHistoryProps {
  sessions: FaceSession[];
  onClearSessions: () => void;
}

export default function SessionHistory({ sessions, onClearSessions }: SessionHistoryProps) {
  const [sortBy, setSortBy] = useState<'recent' | 'duration'>('recent');

  // Ordenar sesiones según el criterio seleccionado
  const sortedSessions = [...sessions].sort((a: FaceSession, b: FaceSession) => {
    if (sortBy === 'duration') {
      return b.duration - a.duration; // Mayor duración primero
    }
    // Por defecto, ordenar por fecha más reciente primero
    return (b.endTime || b.startTime) - (a.endTime || a.startTime);
  });

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

  return (
    <div className="border-t border-gray-700 pt-4 flex-1 flex flex-col min-h-0">
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
        <h4 className="text-sm font-medium text-gray-300">Historial de Sesiones</h4>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'duration')}
            className="text-xs bg-gray-800 text-white px-2 py-1 rounded-lg border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="recent">Más recientes primero</option>
            <option value="duration">Mayor duración</option>
          </select>
          {sessions.length > 0 && (
            <button 
              onClick={onClearSessions}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors whitespace-nowrap"
              title="Borrar historial"
            >
              Borrar todo
            </button>
          )}
        </div>
      </div>
      {sessions.length > 0 ? (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2" style={{ maxHeight: 'calc(100% - 40px)' }}>
          {sortedSessions.map((session) => (
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
                <span className="text-white text-xs">{formatTimeWithAMPM(session.startTime)}</span>
              </div>
              {session.endTime && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-red-400 text-xs">
                      ▼
                    </span>
                    <span className="text-gray-400 ml-1 text-xs">Fin:</span>
                  </div>
                  <span className="text-white text-xs">{formatTimeWithAMPM(session.endTime)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No hay sesiones registradas</p>
      )}
    </div>
  );
}
