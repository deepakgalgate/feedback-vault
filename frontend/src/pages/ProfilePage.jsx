import { useAuth } from '@/lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { User, Star, Settings, LogOut, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ProfilePage = () => {
  const { user, isAuthenticated, isBusinessOwner, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16">
        <div className="container-narrow text-center">
          <User className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Profile</h1>
          <p className="text-zinc-500 mb-6">Log in to view your profile</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="profile-page">
      <div className="container-narrow">
        {/* Profile Header */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-indigo-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 
                className="text-2xl font-bold text-zinc-900"
                style={{ fontFamily: 'Chivo, sans-serif' }}
              >
                {user?.name}
              </h1>
              <p className="text-zinc-500">{user?.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isBusinessOwner 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {isBusinessOwner ? (
                    <>
                      <Building2 className="w-4 h-4" />
                      Business Owner
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      Customer
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
                  <Star className="w-4 h-4" />
                  {user?.review_count || 0} Reviews
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link 
            to="/my-reviews"
            className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
            data-testid="link-my-reviews"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">My Reviews</h3>
                <p className="text-sm text-zinc-500">View all your reviews</p>
              </div>
            </div>
          </Link>

          {isBusinessOwner && (
            <Link 
              to="/dashboard"
              className="bg-white border border-zinc-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all"
              data-testid="link-dashboard"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Business Dashboard</h3>
                  <p className="text-sm text-zinc-500">View analytics and manage items</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h2 className="font-semibold text-zinc-900 mb-4">Account Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium text-zinc-900">{user?.name}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium text-zinc-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-100">
              <dt className="text-zinc-500">Account Type</dt>
              <dd className="font-medium text-zinc-900">
                {isBusinessOwner ? 'Business Owner' : 'Customer'}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-zinc-500">Member Since</dt>
              <dd className="font-medium text-zinc-900">
                {user?.created_at 
                  ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
                  : 'N/A'
                }
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
