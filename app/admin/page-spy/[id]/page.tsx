"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { extractTimestampFromUUIDv7 } from "~/utils/string";
import { AdminHeader } from "../../AdminHeader";

interface PageSpyView {
  id: string;
  ip: string;
  userAgent: string;
  location: string | null;
  photoBase64: string | null;
  pageSpyId: string;
}

interface PageSpy {
  id: string;
  path: string;
  type: string;
}

interface ViewsData {
  pageSpy: PageSpy;
  views: PageSpyView[];
}

export default function PageSpyViewsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<ViewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchViews = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/page-spy/${params.id}/views`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error("Error fetching views:", error);
      alert("Erro ao carregar visualizações");
      router.push("/admin/page-spy");
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (photo: string) => {
    setSelectedPhoto(photo);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  if (loading) {
    return (
      <>
        <AdminHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/page-spy")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Visualizações do PageSpy
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Path:{" "}
            <span className="font-mono font-semibold">{data.pageSpy.path}</span>
          </p>
          <p className="text-sm text-gray-600">
            Total de visualizações:{" "}
            <span className="font-semibold">{data.views.length}</span>
          </p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {data.views.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhuma visualização registrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Foto
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.views.map((view) => {
                    const timestamp = extractTimestampFromUUIDv7(view.id);
                    return (
                      <tr key={view.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {timestamp.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {view.ip}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {view.userAgent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {view.location ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                view.location,
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {view.location}
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {view.photoBase64 ? (
                            <button
                              onClick={() => openPhotoModal(view.photoBase64!)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Ver foto
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Foto capturada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
