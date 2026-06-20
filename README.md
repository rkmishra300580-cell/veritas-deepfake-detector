# Veritas — Deepfake Detection Frontend

This is a Next.js app that talks to your Colab-hosted FastAPI backend
(`DFD_v5_API.ipynb`) to run deepfake/AI-content detection on uploaded files.

## Run locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your current ngrok URL
npm run dev
```

Visit http://localhost:3000

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → import that repo
3. In the import screen, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_BASE_URL` = your current ngrok URL (e.g. `https://outskirts-remorse-railway.ngrok-free.dev`)
4. Click **Deploy**

You'll get a permanent URL like `https://veritas-yourname.vercel.app`.

## IMPORTANT — about the backend URL

Your backend currently runs in Google Colab via ngrok. That URL **changes
every time you restart the Colab notebook**, and the free Colab session
disconnects after a few hours of inactivity.

Whenever that happens:
1. Restart the Colab notebook, copy the new ngrok URL from Cell 15's output
2. Go to Vercel → your project → Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_BASE_URL` to the new URL
4. Vercel → Deployments → click "Redeploy" on the latest deployment

This manual URL-swapping is the biggest weak point in this setup —
the next major upgrade should be moving the backend to a permanent host
(Railway, Render, or similar) so the URL never changes.
