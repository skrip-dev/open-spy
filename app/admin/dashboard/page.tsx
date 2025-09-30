import { AdminHeader } from "../AdminHeader";

export default function DashboardPage() {
  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <p className="text-gray-600">
            Bem-vindo ao painel administrativo do Open Spy!
          </p>
        </div>
      </div>
    </>
  );
}
