import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RouteGuard = ({ allowedRole, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/phone');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userRole = payload.role;

      if (allowedRole && userRole !== allowedRole) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'farmer') {
          navigate('/farmer');
        } else {
          navigate('/customer');
        }
        return;
      }
    } catch (error) {
      console.error('Invalid token:', error);
      navigate('/phone');
    }
  }, [navigate, allowedRole]);

  return children;
};

export default RouteGuard;
