import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-midnight/5 flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 text-midnight/30" aria-hidden />
        </div>
        <p className="ticket-mono text-6xl font-semibold text-midnight mb-2">404</p>
        <h1 className="font-serif text-2xl font-semibold text-midnight mb-2">Off the map</h1>
        <p className="font-sans text-sm text-ink/60 mb-6">
          The page you're looking for has wandered off the itinerary. Let's get you back on route.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" aria-hidden /> Go back
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
