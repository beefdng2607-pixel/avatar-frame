import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="flex flex-col min-h-dvh">
      <Outlet />
    </div>
  );
}
