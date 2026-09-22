import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import NotFoundPage from '@/pages/NotFoundPage';
import CampaignPage from '@/pages/CampaignPage';
import AdminLayout from '@/layouts/AdminLayout';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import RequireAuth from '@/components/RequireAuth';
import { AuthProvider } from '@/stores/AuthContext';
import HomePage from '@/pages/HomePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'c/:slug',
        element: <CampaignPage />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminLoginPage />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
