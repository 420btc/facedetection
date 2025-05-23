'use client';

import { useEffect, useRef } from 'react';

interface FaceLandmark {
  keypoints: Array<{
    x: number;
    y: number;
    name?: string;
  }>;
}

interface FaceCounterProps {
  faces: FaceLandmark[];
  onFaceDetected: (count: number) => void;
}

export default function FaceCounter({ faces, onFaceDetected }: FaceCounterProps) {
  const prevFacesCount = useRef<number>(0);
  const faceCount = useRef<number>(0);

  useEffect(() => {
    const currentFacesCount = faces.length;
    
    // Si antes no había caras y ahora sí, incrementamos el contador
    if (prevFacesCount.current === 0 && currentFacesCount > 0) {
      faceCount.current += 1;
      onFaceDetected(faceCount.current);
      console.log('Nueva cara detectada. Total:', faceCount.current);
    }
    
    // Actualizamos la referencia del contador anterior
    prevFacesCount.current = currentFacesCount;
  }, [faces, onFaceDetected]);

  // No renderizamos nada, solo manejamos la lógica
  return null;
}
