import React, { useCallback, useEffect, useRef, useState } from "react";
import { cropVideo } from "../../cropVideo";

export const VideoPlayer: React.FC = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isCapturing, setCapturing] = useState(false);
  const [last5MinutesChunks, setLast5MinutesChunks] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    handleStartCapture();
  }, []);

  useEffect(() => {
    durationResolve();
  }, [last5MinutesChunks]);

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
  };

  const getBlobDuration = async (blob: Blob | null): Promise<number> => {
    let tempVideoEl: HTMLVideoElement = document.createElement('video');
  
    const durationP: Promise<number> = new Promise((resolve, reject) => {
      tempVideoEl.addEventListener('loadedmetadata', () => {
        if(tempVideoEl.duration === Infinity) {
          tempVideoEl.currentTime = Number.MAX_SAFE_INTEGER
          tempVideoEl.ontimeupdate = () => {
            tempVideoEl.ontimeupdate = null
            resolve(tempVideoEl.duration)
            tempVideoEl.currentTime = 0
          }
        }
        // Normal behavior
        else {
          resolve(tempVideoEl.duration)
        }
      })
    });

    if (blob !== null) {
      tempVideoEl.src = typeof blob === 'string'
        ? blob
        : (URL || window.URL).createObjectURL(blob);
    }

    return durationP;
  };

  const durationResolve = async () => {
    const durationCheck = await getBlobDuration(last5MinutesChunks);
    
    setDuration(durationCheck);
  };

  return (
    <div className="Container">
      <div className="VideoWrapper">
        <video 
          ref={videoRef}
          autoPlay
          controls
          width="640" 
          height="480"
        >
        </video>

        <iframe 
            width="640" 
            height="480" 
            src="https://www.youtube.com/embed/EzGPmg4fFL8" 
            title="YouTube video player"  
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          >
          </iframe>
      </div>
          
      {isCapturing ? (
        <button onClick={handleStopCapture} className="button">Stop Capture</button>
      ) : (
        <button onClick={handleStartCapture} className="button">Start Capture</button>
      )}

      {last5MinutesChunks && (
        <button onClick={() => cropVideo(last5MinutesChunks, setLast5MinutesChunks, duration)} className="button">Save video</button>
      )}
    </div>
  )
})