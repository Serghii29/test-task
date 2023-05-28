export const cropVideo = async (videoData, setLast5MinutesChunks, duration) => {
  try {
    const formData = new FormData();
    formData.append('videoData', videoData);
    formData.append('duration', duration);

    const response = await fetch('http://localhost:5000/crop-video', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();

    // Save the zip file on the user's computer
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = 'last-5-minutes.zip';
    link.click();
  } catch (error) {
    console.error('Error when processing video on the client:', error);
  }
};