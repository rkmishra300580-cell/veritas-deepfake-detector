export const metadata = {
  title: 'Veritas — Deepfake Detection',
  description: 'Forensic-grade deepfake and AI-content detection for images, video, audio and documents.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
