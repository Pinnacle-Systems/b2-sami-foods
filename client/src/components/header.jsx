import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X, Heart, User, LogIn, LogOut, ShoppingBag } from "lucide-react";
import { navLinks } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import { useAuthModal } from "./auth-modal-provider";
import { useAppDispatch, useAppSelector } from "@/redux/Dispatch/useAppDispatch";
import { selectCurrentUser, selectIsAuthenticated, logout } from "@/redux/features/authSlice";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount, wishlist } = useCart();
  const { openLogin, openRegister } = useAuthModal();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/navlogo.png" alt="Logo" width={50} height={50} className="object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground">
              B2{"   "} <span className="text-primary">Sami Foods</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href}
                className="text-muted-foreground hover:text-primary transition-colors font-medium">
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate("/wishlist");
                } else {
                  openLogin();
                }
              }}
              className="relative p-2 hover:bg-muted rounded-full transition-colors hidden sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="w-6 h-6 text-foreground" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate("/cart");
                } else {
                  openLogin();
                }
              }}
              className="relative p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Cart"
            >
              <ShoppingCart className="w-6 h-6 text-foreground" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Auth section – desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="relative group">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border cursor-pointer transition-colors hover:bg-muted/80">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold uppercase">
                        {user.name?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{user.name}</span>
                  </div>

                  {/* Hover Dropdown Menu */}
                  <div className="absolute right-0 top-full pt-2 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1">
                      <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors font-medium">
                        <User size={14} className="opacity-80" /> Profile
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted hover:text-primary transition-colors font-medium">
                        <ShoppingBag size={14} className="opacity-80" /> Orders
                      </Link>
                      <div className="border-t border-border my-1"></div>
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium">
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={openLogin}
                    className="rounded-full px-5 border-border flex items-center gap-2">
                    <LogIn size={15} /> Login
                  </Button>
                  <Button onClick={openRegister}
                    className="rounded-full px-5 bg-primary hover:bg-accent text-primary-foreground flex items-center gap-2">
                    <User size={15} /> Register
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
              {isMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden overflow-y-auto transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-[80vh]" : "max-h-0 overflow-hidden"}`}>
        <nav className="px-4 py-4 bg-card border-t border-border">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.href}
                className="px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}>
                {link.name}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-muted rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-bold uppercase">
                        {user.name?.charAt(0)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{user.name}</span>
                  </div>

                  <Link to="/profile" className="px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors font-medium flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <User size={14} /> Profile
                  </Link>
                  <Link to="/orders" className="px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors font-medium flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <ShoppingBag size={14} /> Orders
                  </Link>

                  <Button variant="outline" onClick={handleLogout}
                    className="w-full rounded-full flex items-center gap-2 mt-1">
                    <LogOut size={15} /> Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline"
                    onClick={() => { setIsMenuOpen(false); openLogin(); }}
                    className="w-full rounded-full flex items-center gap-2">
                    <LogIn size={15} /> Login
                  </Button>
                  <Button onClick={() => { setIsMenuOpen(false); openRegister(); }}
                    className="w-full bg-primary hover:bg-accent text-primary-foreground rounded-full flex items-center gap-2">
                    <User size={15} /> Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
