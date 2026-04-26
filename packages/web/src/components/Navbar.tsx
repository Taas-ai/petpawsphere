import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, PawPrint, LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const isArabic = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('petpawsphere_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={user ? '/dashboard' : '/'}
              className="flex items-center gap-2 text-xl font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              <PawPrint className="h-7 w-7" />
              <span>PetPawSphere</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/pets">Pets</NavLink>
                <NavLink to="/matches">Matches</NavLink>

                {/* Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setToolsOpen(!toolsOpen)}
                    onBlur={() => setTimeout(() => setToolsOpen(false), 150)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    Tools
                    <ChevronDown className={cn('h-4 w-4 transition-transform', toolsOpen && 'rotate-180')} />
                  </button>
                  {toolsOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <DropdownLink to="/tools/breed-detect">Breed Detect</DropdownLink>
                      <DropdownLink to="/tools/translate">Translate</DropdownLink>
                      <DropdownLink to="/tools/vet-advisor">Vet Advisor</DropdownLink>
                      <DropdownLink to="/tools/diagnostic">AI Diagnostics</DropdownLink>
                      <DropdownLink to="/tools/document-scan">Document Scanner</DropdownLink>
                    </div>
                  )}
                </div>

                <NavLink to="/messages">Messages</NavLink>

                {/* User Menu */}
                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-200">
                  {/* Language Toggle */}
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors border border-gray-200"
                    title="Toggle language"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {isArabic ? 'EN' : 'AR'}
                  </button>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {/* Language Toggle (guest) */}
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors border border-gray-200"
                  title="Toggle language"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {isArabic ? 'EN' : 'AR'}
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {user ? (
              <>
                <MobileLink to="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</MobileLink>
                <MobileLink to="/pets" onClick={() => setMobileOpen(false)}>Pets</MobileLink>
                <MobileLink to="/matches" onClick={() => setMobileOpen(false)}>Matches</MobileLink>
                <MobileLink to="/messages" onClick={() => setMobileOpen(false)}>Messages</MobileLink>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">AI Tools</p>
                  <MobileLink to="/tools/breed-detect" onClick={() => setMobileOpen(false)}>Breed Detect</MobileLink>
                  <MobileLink to="/tools/translate" onClick={() => setMobileOpen(false)}>Translate</MobileLink>
                  <MobileLink to="/tools/vet-advisor" onClick={() => setMobileOpen(false)}>Vet Advisor</MobileLink>
                  <MobileLink to="/tools/diagnostic" onClick={() => setMobileOpen(false)}>AI Diagnostics</MobileLink>
                  <MobileLink to="/tools/document-scan" onClick={() => setMobileOpen(false)}>Document Scanner</MobileLink>
                </div>
                <div className="pt-2 mt-2 border-t border-gray-100">
                  {/* Language Toggle (mobile) */}
                  <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    {isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
                  </button>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>{user.name}</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-amber-50 rounded-lg transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  {isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
                </button>
                <MobileLink to="/login" onClick={() => setMobileOpen(false)}>Login</MobileLink>
                <MobileLink to="/register" onClick={() => setMobileOpen(false)}>Register</MobileLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}

function DropdownLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 text-sm text-gray-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-3 py-2 text-sm font-medium text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
    >
      {children}
    </Link>
  );
}
