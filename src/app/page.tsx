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
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Detección de Puntos Faciales</h1>
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
        <div className="text-center">
          <div className="mb-4 p-4 bg-gray-200 rounded-lg">
            <p className="text-2xl font-bold">Caras detectadas: <span className="text-blue-600">{faceCount}</span></p>
            <p className="text-sm text-gray-600 mt-2">
              {isFaceDetected ? 'Cara detectada' : 'Esperando detección...'}
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg shadow">
            <p className="text-lg font-semibold mb-2">Instrucciones</p>
            <ul className="text-sm text-left space-y-1 text-gray-600">
              <li>• El contador aumenta cada vez que se detecta una cara</li>
              <li>• Los puntos azules muestran los puntos faciales generales</li>
              <li>• Los puntos verdes resaltan los ojos</li>
              <li>• Los puntos rojos marcan los labios</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3 text-center">Historial de detecciones</h3>
          {detectionHistory.length === 0 ? (
            <p className="text-gray-500 text-center my-4">No hay detecciones registradas</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {detectionHistory.map((event, index) => (
                <li key={event.id} className="py-2 flex justify-between items-center">
                  <span className="text-sm">Detección #{detectionHistory.length - index}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
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
