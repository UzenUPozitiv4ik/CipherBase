import express from 'express';
import { spawn } from 'child_process';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/decrypt', (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (text.length > 5000) {
    return res.status(413).json({ error: 'Input text too large' });
  }

  const pythonProcess = spawn('python3', ['decrypt.py'], {
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
  });

  let result = '';
  let error = '';
  let timedOut = false;

  const processTimeout = setTimeout(() => {
    timedOut = true;
    pythonProcess.kill();
    res.status(504).json({ error: 'Processing timed out' });
  }, 10000);

  pythonProcess.stdin.write(JSON.stringify({ text }, null, 2), 'utf-8');
  pythonProcess.stdin.end();

  pythonProcess.stdout.on('data', (data) => {
    if (timedOut) return;
    result += data.toString('utf-8');
  });

  pythonProcess.stderr.on('data', (data) => {
     if (timedOut) return;
    error += data.toString('utf-8');
  });

  pythonProcess.on('close', (code) => {
    clearTimeout(processTimeout);
    if (timedOut) return;

    if (code !== 0) {
      console.error(`Python script error: ${error}`);
      return res.status(500).json({ error: 'Python script failed' });
    }
    try {
      const parsedResult = JSON.parse(result);
      res.json(parsedResult);
    } catch (e) {
       console.error(`Failed to parse Python output: ${result}`);
      res.status(500).json({ error: 'Failed to parse Python output' });
    }
  });

  pythonProcess.on('error', (err) => {
    clearTimeout(processTimeout);
     if (timedOut) return;
    console.error(`Failed to start Python process: ${err.message}`);
    res.status(500).json({ error: `Failed to start Python process` });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError && err.status === 413 && 'body' in err) {
     return res.status(413).json({ error: 'Request payload too large' });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
