"use client";

import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';
import dynamic from 'next/dynamic';

// Lazy load the FaceSessionTracker to avoid SSR issues with WebGL
const FaceSessionTracker = dynamic(
  () => import('@/components/FaceSessionTracker'),
  { ssr: false }
);

// Tipos para los keypoints
interface Keypoint {
  x: number;
  y: number;
  name?: string;
}

interface DetectionEvent {
  id: number;
  timestamp: number;
  timeString: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const wasFaceDetected = useRef(false);
  const [faceCount, setFaceCount] = useState(0);
  const [detectionHistory, setDetectionHistory] = useState<DetectionEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('faceDetectionHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  
  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('faceDetectionHistory', JSON.stringify(detectionHistory));
    }
  }, [detectionHistory]);
  
  // Función para limpiar el historial de detecciones
  const clearDetectionHistory = () => {
    if (confirm('¿Estás seguro de que quieres borrar todo el historial de detecciones?')) {
      setDetectionHistory([]);
    }
  };

  // Input resolution configuration
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const inputResolution = { width: 640, height: 480 }; // Tamaño fijo para escritorio
    
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: inputResolution.width },
    height: { ideal: inputResolution.height },
    facingMode: 'user',
    aspectRatio: 1.333, // 4:3 para mantener relación de aspecto
  };

  // Load and configure the model
  const runDetector = async () => {
    try {
      // Set WebGL backend with fallback to CPU if needed
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js is ready with WebGL');
      } catch (error) {
        console.warn('WebGL not available, falling back to CPU', error);
        await tf.setBackend('cpu');
        await tf.ready();
      }

      // Load the MediaPipe FaceMesh model
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig = {
        runtime: 'mediapipe',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
        refineLandmarks: true,
      };
      
      detectorRef.current = await faceLandmarksDetection.createDetector(model, detectorConfig);
      console.log('Face detector model loaded');

      // Function to detect faces
      const detect = async () => {
        if (!webcamRef.current?.video || !canvasRef.current) return;
        
        const video = webcamRef.current.video;
        const faces = await detectorRef.current?.estimateFaces(video) || [];
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Check if any face is detected
        const hasFace = faces.length > 0;
        
        // If face detection state changed
        if (hasFace && !wasFaceDetected.current) {
          // New face detected
          const newCount = faceCount + 1;
          const timestamp = Date.now();
          const newDetection = {
            id: timestamp,
            timestamp,
            timeString: formatTime(timestamp),
          };
          
          setFaceCount(newCount);
          setDetectionHistory(prev => [newDetection, ...prev].slice(0, 50));
          console.log('Nueva cara detectada. Total:', newCount);
        }
        
        // Update face detection state
        setIsFaceDetected(hasFace);
        wasFaceDetected.current = hasFace;
        
        // Draw facial landmarks and bounding box
        faces.forEach((face: { keypoints: Keypoint[] }) => {
          // Calcular bounding box basado en los keypoints
          if (face.keypoints && face.keypoints.length > 0) {
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;
            
            // Encontrar los límites de los keypoints
            face.keypoints.forEach((keypoint: Keypoint) => {
              minX = Math.min(minX, keypoint.x);
              minY = Math.min(minY, keypoint.y);
              maxX = Math.max(maxX, keypoint.x);
              maxY = Math.max(maxY, keypoint.y);
            });
            
            // Añadir un poco de margen
            const margin = 20;
            minX = Math.max(0, minX - margin);
            minY = Math.max(0, minY - margin);
            maxX = Math.min(canvas.width, maxX + margin);
            maxY = Math.min(canvas.height, maxY + margin);
            
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Dibujar el bounding box
            ctx.strokeStyle = '#00FF00'; // Color verde para el borde
            ctx.lineWidth = 2;
            ctx.strokeRect(minX, minY, width, height);
            
            // Añadir etiqueta con fondo para mejor legibilidad
            const label = 'Cara detectada';
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(minX - 2, minY - 17, textWidth + 4, 16);
            ctx.fillStyle = '#00FF00';
            ctx.font = '12px Arial';
            ctx.fillText(label, minX, minY > 10 ? minY - 5 : 10);
          }
          
          // Dibujar puntos de referencia faciales
          face.keypoints.forEach((keypoint: Keypoint) => {
            if (keypoint.name?.includes('lips')) {
              ctx.fillStyle = '#FF0000'; // Rojo para labios
            } else if (keypoint.name?.includes('eye')) {
              ctx.fillStyle = '#00FF00'; // Verde para ojos
            } else {
              ctx.fillStyle = '#FFFFFF'; // Blanco para otros puntos
            }
            
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 1, 0, 2 * Math.PI);
            ctx.fill();
          });
        });
        
        // Continue detection in the next frame
        if (typeof window !== 'undefined') {
          animationRef.current = requestAnimationFrame(detect as FrameRequestCallback);
        }
      };

      // Start detection
      detect();
    } catch (error) {
      console.error('Error loading model:', error);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    let mounted = true;
    
    const detectFaces = async () => {
      if (mounted) {
        await runDetector();
      }
    };
    
    detectFaces();
    
    return () => {
      mounted = false;
      if (animationRef.current && typeof window !== 'undefined') {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <main className="flex flex-col items-center min-h-screen p-4 text-white">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center gap-3">
          {/* Left icon - hidden on mobile */}
          <img 
            src="/iconox.png" 
            alt="Logo" 
            className="hidden md:block h-9 w-9 object-contain" 
            style={{ height: '6em', width: 'auto' }}
          />
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-center">
            FaceTime Tracker
          </h1>
          {/* Right icon - hidden on mobile */}
          <img 
            src="/iconox.png" 
            alt="Logo" 
            className="hidden md:block h-9 w-9 object-contain" 
            style={{ height: '6em', width: 'auto' }}
          />
        </div>
      </div>
      
      {/* Webcam and Session Tracker Row */}
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
        {/* Webcam */}
        <div className="relative w-full lg:w-[640px] h-[480px] bg-black rounded-xl overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
            width={640}
            height={480}
            style={{
              transform: isMobile ? 'scaleX(-1)' : 'none',
              objectFit: 'cover'
            }}
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              transform: isMobile ? 'scaleX(-1)' : 'none',
              transformOrigin: 'center',
              touchAction: 'none',
              zIndex: 10
            }}
          />
        </div>
        
        {/* Session Tracker - Sidebar */}
        <div className="w-full lg:flex-1 h-[480px]">
          <FaceSessionTracker isFaceDetected={isFaceDetected} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto mt-6">
        <div className="flex flex-col gap-6 h-[400px]">
          <div className="text-center">
            <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700">
              <p className="text-2xl font-bold">Caras conectadas: <span className="text-blue-400">{faceCount}</span></p>
              <div className="mt-4 text-center text-gray-300">
                {isFaceDetected ? '✅ Cara conectada' : '👀 Esperando conexión...'}
              </div>
            </div>
            <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700 flex-1">
              <p className="text-xl font-semibold mb-4 text-white">📋 Instrucciones</p>
              <ul className="text-sm text-left space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>El contador aumenta cada vez que se detecta una cara</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Los puntos <span className="text-blue-400">azules</span> muestran los puntos faciales generales</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Los puntos <span className="text-red-400">rojos</span> marcan los labios</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700 overflow-y-auto flex flex-col" style={{ height: '290px' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-semibold text-white">📜 Historial de detecciones</h3>
            {detectionHistory.length > 0 && (
              <button
                onClick={clearDetectionHistory}
                className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors"
                title="Borrar historial de detecciones"
              >
                Borrar todo
              </button>
            )}
          </div>
          {detectionHistory.length === 0 ? (
            <p className="text-gray-400 text-center my-6">No hay detecciones registradas</p>
          ) : (
            <ul className="divide-y divide-gray-700">
              {detectionHistory.map((event, index) => (
                <li key={event.id} className="py-3 flex justify-between items-center hover:bg-gray-800 px-2 rounded-lg transition-colors">
                  <span className="text-gray-200">
                    <span className="font-medium">Detección #{detectionHistory.length - index}</span>
                    <span className="text-xs text-gray-400 ml-2">ID: {event.id}</span>
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-gray-600">
                    {event.timeString}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      

    </main>
  );
}
