import React, { useCallback, useEffect, useRef, useState } from "react";
import { cropVideo } from "../../cropVideo";

export const VideoPlayer: React.FC = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCapturing, setCapturing] = useState(false);
  const [last5MinutesChunks, setLast5MinutesChunks] = useState<Blob | null>(null);

  useEffect(() => {
    handleStartCapture();
  }, []);

  useEffect(() => {
    const drawInterval = setInterval(drawVideoFrame, 100);

    return () => {
      clearInterval(drawInterval);
    };
  }, []);

  const handleStartCapture = useCallback(async () => {
    const videoElement = videoRef.current;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then ((stream) => {
        if (videoElement !== null) {
          videoElement.srcObject = stream;
        }

        mediaRecorderRef.current = new MediaRecorder(stream, { 
          mimeType: 'video/webm'
        });

        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
      
        mediaRecorderRef.current?.start();
        setCapturing(true);
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
      })
  }, []);

  const handleStopCapture = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setCapturing(false);
  }, []);

  const handleDataAvailable = useCallback((event: { data: Blob; }) => {
    if (event.data.size > 0) {
      setLast5MinutesChunks(event.data);
    }
  }, []);

  const drawVideoFrame = () => {
    const videoElement = videoRef.current;
    const canvasElement = webcamRef.current;
    const canvasContext = canvasElement?.getContext('2d');

    if (canvasElement && canvasContext && videoElement) {
      canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasContext.drawImage(
        videoElement, 
        0, 
        0, 
        canvasElement.width, 
        canvasElement.height
      );
    }
  }

  return (
    <div className="Container">
      <video 
        ref={videoRef}
        src="../../../public/test-task.mp4"
        autoPlay
        controls
        width="640" 
        height="480"
      >
      </video>

      <canvas 
        ref={webcamRef}
        width="640" 
        height="480"
        style={{ display: 'none' }}
      >
      </canvas>

      {isCapturing ? (
        <button onClick={handleStopCapture} className="button">Stop Capture</button>
      ) : (
        <button onClick={handleStartCapture} className="button">Start Capture</button>
      )}

      {last5MinutesChunks && (
        <button onClick={() => cropVideo(last5MinutesChunks, setLast5MinutesChunks)} className="button">Save video</button>
      )}
    </div>
  )
})