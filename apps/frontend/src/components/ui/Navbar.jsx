import { useState } from "react";
import { Link } from "react-router-dom";
import { PenSquare, User, LogOut, PenTool, House, Menu, X, LogIn, UserPlus } from "lucide-react";
import Button from "./Button.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";

const Navbar = () => {
  const { userId, logoutUser } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-background/40 backdrop-blur-md">
      <div className="mx-auto px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <PenSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-white">BlogAI</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/create-blog">
            <Button variant="ghost" size="sm">
              <PenTool className="w-4 h-4 mr-2" />
              Create Blog
            </Button>
          </Link>

          {userId ? (
            <>
              <Link to="/feed">
                <Button variant="ghost" size="sm">
                  <House className="w-4 h-4 mr-2" />
                  Feed
                </Button>
              </Link>

              <Link to={`/user/${userId}`}>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>

              <Button variant="outline" size="sm" onClick={logoutUser}>
                Logout
                <LogOut className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Log in
                </Button>
              </Link>

              <Link to="/signup">
                <Button variant="secondary" size="sm">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden p-2 rounded-lg hover:bg-slate-800">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu View */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-md border-b border-slate-800
          animate-mobile-menu ${mobileOpen ? "animate-mobile-menu-enter" : "animate-mobile-menu-exit"}`}
      >
        <div className="max-w-6xl mx-auto p-8 flex flex-col gap-2">
          <Link to="/create-blog" onClick={() => setMobileOpen(false)}>
            <Button variant="secondary" className="w-full justify-start">
              <PenTool className="w-4 h-4 mr-2" />
              Create Blog
            </Button>
          </Link>

          {userId ? (
            <>
              <Link to="/feed" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full justify-start">
                  <House className="w-4 h-4 mr-2" />
                  Feed
                </Button>
              </Link>

              <Link to={`/user/${userId}`} onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>

              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => {
                  logoutUser();
                  setMobileOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="primary" className="w-full justify-start">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log in
                </Button>
              </Link>

              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" className="w-full justify-start">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
