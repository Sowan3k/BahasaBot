module.exports = {
  apps: [
    {
      name: 'basahabot-backend',
      cwd: './',
      script: './backend/venv/Scripts/python.exe',
      args: '-m uvicorn backend.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
    },
    {
      name: 'basahabot-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      interpreter: 'none',
    },
  ],
};
