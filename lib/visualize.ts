import { createCanvas } from "canvas"
import { EssentiaExtractor, Essentia, EssentiaWASM } from "essentia.js"
import fs from 'fs'
import tmp from 'tmp'
import path from 'path'
import wav from 'node-wav'
import ffmpeg from 'fluent-ffmpeg'

// Types for the generateSpectrogram function parameters and return value

/**
 * Configuration options for spectrogram generation
 */
export interface SpectrogramOptions {
    /** Size of the FFT window in samples. Higher values give better frequency resolution but worse time resolution. */
    frameSize?: number;
    
    /** Number of samples between successive FFT windows. Lower values give more overlap. */
    hopSize?: number;
    
    /** Width of the output video in pixels */
    width?: number;
    
    /** Height of the output video in pixels */
    height?: number;
    
    /** Frames per second for the output video */
    fps?: number;
    
    /** Sample rate of the audio in Hz (usually detected automatically from the audio file) */
    sampleRate?: number;
    
    /** Color scheme for the spectrogram. Default is 'yellowRed' */
    colorScheme?: 'yellowRed' | 'viridis' | 'magma' | 'grayscale';
    
    /** Minimum decibel value for color scaling. Default is -100 */
    minDecibels?: number;
    
    /** Maximum decibel value for color scaling. Default is 0 */
    maxDecibels?: number;
    
    /** Whether to show time markers on the spectrogram */
    showTimeMarkers?: boolean;
    
    /** Whether to show frequency markers on the spectrogram */
    showFrequencyMarkers?: boolean;
    
    /** Font for text elements */
    font?: string;
    
    /** Video encoding quality (0-51, where lower is better quality). Default is 23 */
    crf?: number;
    
    /** Video encoding preset (affects encoding speed vs compression ratio) */
    preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  }
  
export async function generateSpectrogram(audioFilePath: string, options: SpectrogramOptions = {}): Promise<string> {
    // Default configuration
    const config = {
      frameSize: 2048,
      hopSize: 1024,
      width: 800,
      height: 400,
      fps: 30,
      ...options
    };
    
    // Initialize essentia
    const essentia = new Essentia(EssentiaWASM);
    
    // Read and decode audio file
    const buffer = fs.readFileSync(audioFilePath);
    let audioData: Float32Array;
    
    // Create a temporary directory for frames
    const tmpDir = tmp.dirSync({ prefix: 'spectrogram-frames-' }).name;
    
    try {
      if (path.extname(audioFilePath).toLowerCase() === '.wav') {
        // Use node-wav for WAV files
        const decoded = wav.decode(buffer);
        audioData = decoded.channelData[0]; // Use first channel
        if(decoded.channelData.length > 1) audioData = audioData.map((value, index) => (value + decoded.channelData[1][index]))
        config.sampleRate = decoded.sampleRate;
      } else {
        // For other formats, convert to WAV first using ffmpeg
        const tmpWavFile = tmp.fileSync({ postfix: '.wav' }).name;
        await new Promise((resolve, reject) => {
          ffmpeg(audioFilePath)
            .toFormat('wav')
            .on('error', reject)
            .on('end', resolve)
            .save(tmpWavFile);
        });
        
        const wavBuffer = fs.readFileSync(tmpWavFile);
        const decoded = wav.decode(wavBuffer);
        audioData = decoded.channelData[0];
        config.sampleRate = decoded.sampleRate;
        fs.unlinkSync(tmpWavFile);
      }
      
      // Create canvas for spectrogram rendering
      const canvas = createCanvas(config.width, config.height);
      const ctx = canvas.getContext('2d');
      
     // Calculate how many frames to process
    const durationInSeconds = audioData.length / config.sampleRate;
    const totalFrames = Math.floor(durationInSeconds * config.fps);
    const samplesPerFrame = Math.floor(config.sampleRate / config.fps);
    
    console.log(`Audio duration: ${durationInSeconds.toFixed(2)}s, Total frames: ${totalFrames}`);
    
    // Pre-calculate window function (Hann window)
    const windowFunction = new Float32Array(config.frameSize);
    for (let i = 0; i < config.frameSize; i++) {
      windowFunction[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (config.frameSize - 1)));
    }
    
    // Process frames
    for (let frame = 0; frame < totalFrames; frame++) {
      // Clear canvas
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, config.width, config.height);
      
      // Calculate which audio sample to start from
      const startSample = frame * samplesPerFrame;
      if (startSample >= audioData.length) break;
      
      // Grab audio chunk for this frame
      const endSample = Math.min(startSample + config.frameSize, audioData.length);
      const chunk = audioData.slice(startSample, endSample);
      
      // Create windowed chunk
      const windowedChunk = new Float32Array(config.frameSize);
      for (let i = 0; i < chunk.length; i++) {
        windowedChunk[i] = chunk[i] * windowFunction[i];
      }
      
      // Compute spectrogram using essentia
      const vec = essentia.arrayToVector(windowedChunk)
      console.log(vec)
      const spectrum = essentia.Spectrum(vec);
      const spectrumValues = spectrum.spectrum;
      console.log(spectrumValues)
      
      // Specify the frequency range to display (discard upper frequencies for better visualization)
      const maxBin = Math.min(spectrumValues.length / 2, Math.floor(config.sampleRate / 4)); // Display up to 1/4 of sampleRate
      
      // Calculate frequency step and draw frequency labels
      const freqStep = config.sampleRate / config.frameSize;
      ctx.fillStyle = 'gray';
      ctx.font = '10px Arial';
      for (let freq = 1000; freq < (maxBin * freqStep); freq += 1000) {
        const y = config.height - (freq / (maxBin * freqStep) * config.height);
        ctx.fillText(`${Math.round(freq / 1000)}kHz`, 5, y);
      }
      
      // Draw spectrogram - process the spectrum in log scale for better visualization
      const binWidth = config.width / maxBin;
      for (let i = 0; i < maxBin; i++) {
        // Convert magnitude to dB scale
        const magnitude = 20 * Math.log10(Math.max(0.0000001, spectrumValues[i]));
        
        const normalized = Math.max(0, Math.min(1, (magnitude + 60) / 50));
        
        // Use a color scale (black to yellow to red)
        const r = Math.floor(Math.min(255, 20 + spectrumValues[i] * 2 * 255));
        const g = Math.floor(Math.min(255, 20 + spectrumValues[i] * 255));
        const b = Math.floor(Math.min(100, 10 + spectrumValues[i] * 90));
            
        // Draw vertical line representing this frequency bin
        const x = i * binWidth;
        const height = normalized * config.height;
        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(x, config.height - height, binWidth + 0.5, height); // +0.5 to avoid gaps
      }
      
      // Add time markers
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      const currentTime = (startSample / config.sampleRate).toFixed(1);
      ctx.fillText(`Time: ${currentTime}s`, 10, 20);
      
      // Save the frame
      const framePath = path.join(tmpDir, `frame-${frame.toString().padStart(6, '0')}.png`);
      const out = fs.createWriteStream(framePath);
      const stream = canvas.createPNGStream();
      await new Promise<void>((resolve) => {
        stream.pipe(out);
        out.on('finish', resolve);
      });
      
      // Log progress
      if (frame % 10 === 0) {
        console.log(`Processed ${frame}/${totalFrames} frames (${Math.round(frame/totalFrames*100)}%)`);
      }
    }
    
    // Create output mp4 file
    const outputPath = tmp.fileSync({ postfix: '.mp4' }).name;
      
      // Use ffmpeg to combine frames into video
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(path.join(tmpDir, 'frame-%06d.png'))
          .input(audioFilePath)
          .inputFPS(config.fps)
          .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-preset fast',
            '-crf 23'
          ])
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
      
      return outputPath;
    } finally {
      // Clean up temporary frames directory
      if (fs.existsSync(tmpDir)) {
        fs.rmdirSync(tmpDir, { recursive: true });
      }
    }
  }