"use client";

import { useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import Webcam from 'react-webcam';

// Tipos para los keypoints
interface Keypoint {
  x: number;
  y: number;
  name?: string;
}

interface Face {
  keypoints: Keypoint[];
}

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

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
      
      const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      console.log('Face detector model loaded');

      // Function to detect faces
      const detect = async () => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const faces = await detector.estimateFaces(video);

          // Draw facial landmarks on canvas
          const canvas = canvasRef.current;
          if (!canvas) return;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Clear previous frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw facial landmarks
          faces.forEach((face: Face) => {
            face.keypoints.forEach((keypoint: Keypoint) => {
              if (keypoint.name?.includes('lips')) {
                ctx.fillStyle = '#FF0000'; // Red for lips
              } else if (keypoint.name?.includes('eye')) {
                ctx.fillStyle = '#00FF00'; // Green for eyes
              } else {
                ctx.fillStyle = '#0000FF'; // Blue for other points
              }
              
              ctx.beginPath();
              ctx.arc(keypoint.x, keypoint.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          });
        }
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
    runDetector();
    return () => {
      if (animationRef.current && typeof window !== 'undefined') {
        cancelAnimationFrame(animationRef.current);
      }
    };
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
      <div className="mt-6 text-center text-gray-600">
        <p>La aplicación está detectando puntos faciales en tiempo real.</p>
        <p className="mt-2 text-sm">
          Puntos: <span className="text-blue-500">Azul</span> - General | 
          <span className="text-green-500"> Verde</span> - Ojos | 
          <span className="text-red-500"> Rojo</span> - Labios
        </p>
      </div>
    </main>
  );
}
