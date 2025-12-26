import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./lib/auth";

// Layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import BrowsePage from "./pages/BrowsePage";
import CategoriesPage from "./pages/CategoriesPage";
import ItemDetailPage from "./pages/ItemDetailPage";
import ProfilePage from "./pages/ProfilePage";
import MyReviewsPage from "./pages/MyReviewsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ManageItemsPage from "./pages/dashboard/ManageItemsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-background">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/search" element={<BrowsePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:categoryId" element={<BrowsePage />} />
              <Route path="/items/:itemId" element={<ItemDetailPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/my-reviews" element={<MyReviewsPage />} />
              
              {/* Business Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/items" element={<ManageItemsPage />} />
              <Route path="/dashboard/analytics" element={<DashboardPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
