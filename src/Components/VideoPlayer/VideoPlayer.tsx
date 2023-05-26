import React, { useCallback, useEffect, useRef, useState } from "react";

export const VideoPlayer: React.FC = React.memo(() => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isCapturing, setCapturing] = useState(false);
  const [last5MinutesChunks, setLast5MinutesChunks] = useState<Blob[]>([]);

  const handleStartCapture = useCallback(() => {
    // chunksRef.current = [];
    mediaRecorderRef.current?.start();
    setCapturing(true);
  }, []);

  const handleStopCapture = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setCapturing(false);
    saveLast5MinutesCapture();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRecorderRef.current]);

  // const saveCapture = useCallback(() => {
  //   const blob = new Blob(chunksRef.current, { type: 'video/webm' });
  //   const videoURL = URL.createObjectURL(blob);
  //   const link = document.createElement('a');

  //   document.body.appendChild(link)

  //   link.href = videoURL;

  //   link.download = 'recorded-video.webm';

  //   // link.click();
  // }, []);

  const saveRecentRecording = () => {
    const chunks = chunksRef.current;
    const videoBlob = new Blob(chunks, { type: 'video/webm' });

    // Создаем URL для видео и добавляем его в DOM
    const videoURL = URL.createObjectURL(videoBlob);
    const videoElement = document.createElement('video');
    videoElement.src = videoURL;
    videoElement.controls = true;
    document.body.appendChild(videoElement);

    // Добавляем временные метки в видео
    const currentTime = new Date().toLocaleString();
    const timestampText = document.createTextNode(`Record: ${currentTime}`);
    const timestampElement = document.createElement('p');
    timestampElement.appendChild(timestampText);

    if (videoElement.parentNode !== null) {
      videoElement.parentNode.insertBefore(timestampElement, videoElement.nextSibling);
    }

    // Ограничиваем хранение только последних 5 минут записи
    if (chunks.length > 300) {
      chunks.shift();
    }
  };

  const saveLast5MinutesCapture = useCallback(() => {
    const allChunks = [...last5MinutesChunks, ...chunksRef.current];
    setLast5MinutesChunks(allChunks.slice(-300));
  }, [last5MinutesChunks]);

  useEffect(() => {
    const videoElement = videoRef.current;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then ((stream) => {
        if (videoElement !== null) {
          videoElement.srcObject = stream;
          // videoElement.play();
        }

        mediaRecorderRef.current = new MediaRecorder(stream, { 
          mimeType: 'video/webm'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
            saveRecentRecording();
          }
        }

        handleStartCapture();
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
      })
  }, [handleStartCapture]);

   useEffect(() => {
    const videoElement = videoRef.current;
    const canvasElement = webcamRef.current;
    const canvasContext = canvasElement?.getContext('2d');

    const drawOverlay = () => {
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

    const drawInterval = setInterval(drawOverlay, 100);

    return () => {
      clearInterval(drawInterval);
    };
  }, []);

  const handleDownloadLast5Minutes = () => {
    const combinedBlob = new Blob(last5MinutesChunks, { type: 'video/webm' });
    const videoURL = URL.createObjectURL(combinedBlob);
    const link = document.createElement('a');

    link.href = videoURL;
    link.download = 'last-5-minutes.webm';
    link.click();
  };

  console.log('chunksRef:', chunksRef.current, 'last5MinutesChunks:', last5MinutesChunks);

  return (
    <div className="Container">
      <video 
        ref={videoRef}
        src="../../../public/test-task.mp4"
        autoPlay
        controls
        width="640" 
        height="480"
        style={{ display: 'none' }}
      >
      </video>

      <canvas 
        ref={webcamRef}
        width="640" 
        height="480"
        // style={{ display: 'none' }}
      >
      </canvas>

      {isCapturing ? (
        <button onClick={handleStopCapture} className="button">Stop Capture</button>
      ) : (
        <button onClick={handleStartCapture} className="button">Start Capture</button>
      )}

      {last5MinutesChunks.length > 0 && (
        <button onClick={handleDownloadLast5Minutes} className="button">Save video</button>
      )}
    </div>
  )
})