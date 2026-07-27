import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  const isAdmin = user?.role === "admin";

  if (authLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

export default ProtectedRoute;
