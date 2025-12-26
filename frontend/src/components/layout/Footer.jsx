import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-zinc-400" data-testid="footer">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white" style={{ fontFamily: 'Chivo, sans-serif' }}>
                FeedbackVault
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              The granular feedback platform that helps you discover the best products and services with variant-level ratings and insights.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-sm hover:text-white transition-colors">
                  Browse All
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-white transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-white transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Business</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/register?type=business" className="text-sm hover:text-white transition-colors">
                  Business Account
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/analytics" className="text-sm hover:text-white transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} FeedbackVault. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-xs hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
