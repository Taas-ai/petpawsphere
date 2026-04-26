import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { CookieBanner } from '@/components/CookieBanner';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { PetsList } from '@/pages/PetsList';
import { PetCreate } from '@/pages/PetCreate';
import { PetDetail } from '@/pages/PetDetail';
import { PetEdit } from '@/pages/PetEdit';
import { MatchesList } from '@/pages/MatchesList';
import { MatchDetail } from '@/pages/MatchDetail';
import { Messages } from '@/pages/Messages';
import { ChatThread } from '@/pages/ChatThread';
import { Profile } from '@/pages/Profile';
import { Verification } from '@/pages/Verification';

// Lazy-loaded pages (heavier AI tool pages + match create)
const BreedDetect = lazy(() => import('./pages/BreedDetect').then(m => ({ default: m.BreedDetect })));
const Translate = lazy(() => import('./pages/Translate').then(m => ({ default: m.Translate })));
const VetAdvisor = lazy(() => import('./pages/VetAdvisor').then(m => ({ default: m.VetAdvisor })));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const DocumentScan = lazy(() => import('./pages/DocumentScan'));
const MatchCreate = lazy(() => import('./pages/MatchCreate').then(m => ({ default: m.MatchCreate })));
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/pets" element={<ProtectedRoute><PetsList /></ProtectedRoute>} />
          <Route path="/pets/new" element={<ProtectedRoute><PetCreate /></ProtectedRoute>} />
          <Route path="/pets/:id" element={<ProtectedRoute><PetDetail /></ProtectedRoute>} />
          <Route path="/pets/:id/edit" element={<ProtectedRoute><PetEdit /></ProtectedRoute>} />
          <Route path="/matches" element={<ProtectedRoute><MatchesList /></ProtectedRoute>} />
          <Route path="/matches/new" element={<ProtectedRoute><MatchCreate /></ProtectedRoute>} />
          <Route path="/matches/:id" element={<ProtectedRoute><MatchDetail /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:matchId" element={<ProtectedRoute><ChatThread /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
          <Route path="/tools/breed-detect" element={<ProtectedRoute><BreedDetect /></ProtectedRoute>} />
          <Route path="/tools/translate" element={<ProtectedRoute><Translate /></ProtectedRoute>} />
          <Route path="/tools/vet-advisor" element={<ProtectedRoute><VetAdvisor /></ProtectedRoute>} />
          <Route path="/tools/diagnostic" element={<ProtectedRoute><Diagnostic /></ProtectedRoute>} />
          <Route path="/tools/document-scan" element={<ProtectedRoute><DocumentScan /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <CookieBanner />
    </div>
  );
}
