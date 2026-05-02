import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import Loader from "./ui/Loader";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, accessToken, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="flex flex-row gap-3 items-center text-2xl text-secondary">
          <Loader size="lg" /> Loading...
        </p>
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
