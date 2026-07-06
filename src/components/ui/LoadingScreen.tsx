import './LoadingScreen.css';

interface LoadingScreenProps {
  message: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="screen loading-screen">
      <div className="loading-content">
        <div className="loading-bull">
          <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="loading-bull-svg">
            <path d="M10 28 C10 28, 5 18, 13 12 C18 8, 20 15, 20 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M70 28 C70 28, 75 18, 67 12 C62 8, 60 15, 60 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="40" cy="38" rx="24" ry="17" fill="currentColor" opacity="0.2"/>
            <circle cx="32" cy="32" r="3" fill="currentColor"/>
            <circle cx="48" cy="32" r="3" fill="currentColor"/>
          </svg>
        </div>

        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>

        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}
