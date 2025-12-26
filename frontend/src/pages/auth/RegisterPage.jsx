import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Eye, EyeOff, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState(searchParams.get('type') === 'business' ? 'business_owner' : 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, userType);
      toast.success('Account created successfully!');
      navigate(userType === 'business_owner' ? '/dashboard' : '/');
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to create account';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4" data-testid="register-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
              FeedbackVault
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900" style={{ fontFamily: 'Chivo, sans-serif' }}>
            Create your account
          </h1>
          <p className="text-zinc-500 mt-1">Join the feedback community</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type */}
            <div className="space-y-3">
              <Label>Account Type</Label>
              <RadioGroup value={userType} onValueChange={setUserType} className="grid grid-cols-2 gap-3">
                <label 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    userType === 'customer' ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  data-testid="account-type-customer"
                >
                  <RadioGroupItem value="customer" id="customer" />
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm font-medium">Customer</span>
                  </div>
                </label>
                <label 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    userType === 'business_owner' ? 'border-indigo-500 bg-indigo-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                  data-testid="account-type-business"
                >
                  <RadioGroupItem value="business_owner" id="business_owner" />
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-zinc-600" />
                    <span className="text-sm font-medium">Business</span>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="register-name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="register-email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="register-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="register-confirm-password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
              data-testid="register-submit"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
