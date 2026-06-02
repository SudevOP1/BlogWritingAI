import { Link } from "react-router-dom";
import { PenSquare, User, LogOut, PenTool } from "lucide-react";
import Button from "./Button.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logoutUser } = useAuthContext();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-background/40 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <PenSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white">BlogAI</span>
        </Link>

        <div className="flex items-center space-x-4">
          <Link to="/create-blog">
            <Button variant="ghost" size="sm">
              <PenTool className="w-4 h-4 mr-2" />
              Create Blog
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logoutUser}
                className="flex flex-row items-center justify-center gap-2"
              >
                Logout <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
