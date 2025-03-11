import express from 'express'
import morgan from 'morgan'
import multer from 'multer'
import tmp from 'tmp'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { generateSpectrograph } = require("./build/Release/visualize")

const app = express();

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, cb) {
            const tempDir = tmp.dirSync({prefix: 'audio-upload-'}).name
            cb(null, tempDir)
        },

        filename(req, file, callback) {
            callback(null, file.originalname)
        },
    }),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size
      }
    
})

app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
      <html>
        <head>
          <title>Spectrogram Generator</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            form { background: #f8f8f8; padding: 20px; border-radius: 5px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input { margin-bottom: 15px; padding: 8px; width: 100%; box-sizing: border-box; }
            button { background: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer; }
            button:hover { background: #45a049; }
          </style>
        </head>
        <body>
          <h1>Generate Spectrogram</h1>
          <form action="/api/spectrogram" method="post" enctype="multipart/form-data">
            <div>
              <label for="audioFile">Audio File:</label>
              <input type="file" id="audioFile" name="audioFile" accept="audio/*" required>
            </div>
            <div>
              <label for="width">Width:</label>
              <input type="number" id="width" name="width" value="800">
            </div>
            <div>
              <label for="height">Height:</label>
              <input type="number" id="height" name="height" value="400">
            </div>
            <div>
              <label for="fps">FPS:</label>
              <input type="number" id="fps" name="fps" value="30">
            </div>
            <div>
              <label for="frameSize">Frame Size (power of 2):</label>
              <input type="number" id="frameSize" name="frameSize" value="2048">
            </div>
            <div>
              <button type="submit">Generate</button>
            </div>
          </form>
        </body>
      </html>
      `);
})

app.post('/api/spectrogram', upload.single('audioFile'), async (req, res) => {
    // if (!req.file) {
    //      res.status(400).json({ error: 'No audio file uploaded' });
    //      return
    //   }
      
    //   try {
    //     // Parse options from request body
    //     const options = {
    //       frameSize: parseInt(req.body.frameSize) || 2048,
    //       hopSize: parseInt(req.body.hopSize) || 1024,
    //       width: parseInt(req.body.width) || 800,
    //       height: parseInt(req.body.height) || 400,
    //       fps: parseInt(req.body.fps) || 30
    //     };
        
    //     // Generate spectrogram
    //     const outputPath = await generateSpectrogram(req.file.path, options);
        
    //     // Set appropriate headers
    //     res.setHeader('Content-Type', 'video/mp4');
    //     res.setHeader('Content-Disposition', `attachment; filename="spectrogram.mp4"`);
        
    //     // Stream the file to the client
    //     const fileStream = fs.createReadStream(outputPath);
    //     fileStream.pipe(res);
        
    //     // Clean up when done
    //     fileStream.on('end', () => {
    //       // Delete temporary files
    //       fs.unlinkSync(outputPath);
    //       fs.unlinkSync(req.file!.path);
    //       fs.rmdirSync(path.dirname(req.file!.path), { recursive: true });
    //     });
    //   } catch (error) {
    //     console.error('Error generating spectrogram:', error);
    //      res.status(500).json({ error: 'Failed to generate spectrogram' });
    //   }
    
    res.status(200).send(generateSpectrograph());
})

app.listen(3000, () => console.log("listening on 3000"))