import Link from "next/link";
import { AdminHeader } from "../AdminHeader";

export default function DashboardPage() {
  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <p className="text-gray-600">
            Bem-vindo ao painel administrativo do Open Spy!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/page-spy"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-md flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gerenciar PageSpy
            </h3>
            <p className="text-sm text-gray-600">
              Cadastrar e gerenciar itens de rastreamento
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
