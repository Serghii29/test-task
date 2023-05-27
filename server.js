const express = require('express');
const port = 5000;
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const archiver = require('archiver');

const app = express();

// Allow receiving requests from another port
app.use(cors({
  origin: 'http://localhost:3000'
}));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Setting up Multer to upload files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Route for processing a POST request for video cropping
app.post('/crop-video', upload.single('videoData'), (req, res) => {
  if (!req.file) {
    res.status(400).send('The file was not received');
    return;
  }

  const videoPath = req.file.path;
  const uniqueFilename = `${Date.now()}-last5.mp4`;

  const ffprobeProcess = spawn('ffprobe', [
    '-v',
    'error',
    '-select_streams',
    'v:0',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ]);

  ffprobeProcess.stdout.on('data', (data) => {
    const trimVideoPath = path.join(__dirname, 'trimVideo');

    // Сheck if the folder exists trimVideo
    if (!fs.existsSync(trimVideoPath)) {
      fs.mkdirSync(trimVideoPath);
    }

    const outputPath = path.join(trimVideoPath, uniqueFilename);
  
    const trimProcess = spawn('ffmpeg', [
      '-i',
      videoPath,
      '-ss',
      '00:00:00',
      '-t',
      '00:05:00',
      '-c',
      'copy',
      outputPath,
    ]);

    trimProcess.on('close', (code) => {
      if (code === 0) {
        // Compressing the cropped video as a zip file
        const zipPath = path.join(trimVideoPath, `${Date.now()}-last5.zip`);
        const outputZip = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        outputZip.on('close', () => {
          // Sending the zip file to the client
          res.sendFile(zipPath, (err) => {
            if (err) {
              console.error('Error sending file:', err);
            }

            // Delete the uploaded and processed files after sending
            fs.unlink(videoPath, (err) => {
              if (err) {
                console.error('Error deleting video file:', err);
              }
            });

            fs.unlink(outputPath, (err) => {
              if (err) {
                console.error('Error deleting processed video file:', err);
              }
            });

            fs.unlink(zipPath, (err) => {
              if (err) {
                console.error('Error deleting zip file:', err);
              }
            });
          });
        });

        archive.pipe(outputZip);
        archive.file(outputPath, { name: uniqueFilename });
        archive.finalize();
      } else {
        res.status(500).send('Error processing video on the server');
      }
    });
  })
});

// Starting the server
app.listen(port, () => {
  console.log('The server is running on port 5000');
});
