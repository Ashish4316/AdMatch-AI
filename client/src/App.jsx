import { Routes, Route } from 'react-router-dom';

// Placeholder pages — replace with real pages as features are built
const Home = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fade-in">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-accent-400 bg-clip-text text-transparent">
      AdMatch AI
    </h1>
    <p className="text-slate-400 text-lg">AI-powered influencer ↔ brand matching platform</p>
    <span className="badge bg-accent-500/10 text-accent-400 border border-accent-500/20">
      Setup complete — start building features!
    </span>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-3">
    <h2 className="text-6xl font-bold text-slate-700">404</h2>
    <p className="text-slate-400">Page not found</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Add feature routes here */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
