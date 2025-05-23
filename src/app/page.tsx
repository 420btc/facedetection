"use client";

import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';

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
  const [detectionHistory, setDetectionHistory] = useState<DetectionEvent[]>([]);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  // Input resolution configuration
  const inputResolution = { width: 640, height: 480 };
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: inputResolution.width },
    height: { ideal: inputResolution.height },
    facingMode: 'user',
  };

  // Load and configure the model
  const runDetector = async () => {
    try {
      // Set WebGL backend
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('TensorFlow.js is ready');

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
        
        // Draw facial landmarks
        faces.forEach((face: { keypoints: Keypoint[] }) => {
          face.keypoints.forEach((keypoint: Keypoint) => {
            if (keypoint.name?.includes('lips')) {
              ctx.fillStyle = '#FF0000'; // Rojo para labios
            } else if (keypoint.name?.includes('eye')) {
              ctx.fillStyle = '#00FF00'; // Verde para ojos
            } else {
              ctx.fillStyle = '#0000FF'; // Azul para otros puntos
            }
            
            ctx.beginPath();
            ctx.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <h1 className="text-3xl font-bold mb-8 text-white">Detección de Puntos Faciales</h1>
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={videoConstraints}
          className="rounded-lg shadow-lg"
          width={inputResolution.width}
          height={inputResolution.height}
        />
        <canvas
          ref={canvasRef}
          width={inputResolution.width}
          height={inputResolution.height}
          className="absolute top-0 left-0"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto mt-6">
        <div className="flex flex-col gap-6 h-[100px]">
          <div className="text-center">
          <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700">
            <p className="text-2xl font-bold">Caras detectadas: <span className="text-blue-400">{faceCount}</span></p>
            <div className="mt-4 text-center text-gray-300">
              {isFaceDetected ? '✅ Cara detectada' : '👀 Esperando detección...'}
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
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Los puntos <span className="text-green-400">verdes</span> marcan los ojos</span>
              </li>
            </ul>
          </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-900 bg-opacity-70 rounded-xl border border-gray-700 overflow-y-auto" style={{ height: '320px' }}>
          <h3 className="text-xl font-semibold mb-4 text-white text-center">📜 Historial de detecciones</h3>
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
