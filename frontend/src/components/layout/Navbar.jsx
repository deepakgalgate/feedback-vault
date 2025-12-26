import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Menu, X, User, LogOut, BarChart3, Star, Building2 } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isBusinessOwner, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { href: '/browse', label: 'Browse' },
    { href: '/categories', label: 'Categories' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200" data-testid="navbar">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2"
            data-testid="navbar-logo"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              FeedbackVault
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link ${isActive(link.href) ? 'active' : ''}`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex relative">
            <div className="input-group">
              <Search className="input-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Search items, variants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-10 pl-10 pr-4 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                data-testid="search-input"
              />
            </div>
          </form>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2"
                    data-testid="user-menu-trigger"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="hidden sm:inline font-medium">{user?.name?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-reviews')} data-testid="menu-reviews">
                    <Star className="w-4 h-4 mr-2" />
                    My Reviews
                  </DropdownMenuItem>
                  {isBusinessOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="menu-dashboard">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Business Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/dashboard/items')} data-testid="menu-manage-items">
                        <Building2 className="w-4 h-4 mr-2" />
                        Manage Items
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="menu-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  data-testid="login-button"
                >
                  Log In
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  data-testid="register-button"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-zinc-100" data-testid="mobile-menu">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="input-group">
                <Search className="input-icon w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search items, variants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block px-3 py-2 rounded-lg font-medium ${
                    isActive(link.href) 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
