import { Navigate } from 'react-router-dom';

interface SaaSPrivateRouteProps {
  children: React.ReactNode;
}

export const SaaSPrivateRoute: React.FC<SaaSPrivateRouteProps> = ({ children }) => {
  const token = localStorage.getItem('saasToken');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
