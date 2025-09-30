"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { enumPageSpyTranslation, enumPageSpyType } from "~/prisma/enumMap";
import { AdminHeader } from "../AdminHeader";

interface PageSpy {
  id: string;
  path: string;
  type: string;
  textString: string | null;
  fileBase64: string | null;
  _count: {
    views: number;
  };
}

export default function PageSpyManagementPage() {
  const router = useRouter();
  const [pageSpies, setPageSpies] = useState<PageSpy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [path, setPath] = useState("");
  const [type, setType] = useState<"TEXT" | "IMAGE">("TEXT");
  const [textString, setTextString] = useState("");
  const [fileBase64, setFileBase64] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchPageSpies();
  }, []);

  const fetchPageSpies = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/admin/page-spy", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const data = await response.json();
      setPageSpies(data.data);
    } catch (error) {
      console.error("Error fetching page spies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const token = localStorage.getItem("admin_token");
      const url = editingId
        ? `/api/admin/page-spy/${editingId}`
        : "/api/admin/page-spy";
      const method = editingId ? "PUT" : "POST";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: Record<string, any> = {
        path,
        type,
      };

      if (type === "TEXT") {
        body.textString = textString;
      } else {
        body.fileBase64 = fileBase64;
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Erro ao salvar");
        return;
      }

      // Reset form
      setPath("");
      setType("TEXT");
      setTextString("");
      setFileBase64("");
      setShowForm(false);
      setEditingId(null);

      // Refresh list
      fetchPageSpies();
    } catch {
      setFormError("Erro ao conectar com o servidor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (item: PageSpy) => {
    setEditingId(item.id);
    setPath(item.path);
    setType(item.type as "TEXT" | "IMAGE");
    setTextString(item.textString || "");
    setFileBase64(item.fileBase64 || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este item?")) {
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/admin/page-spy/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        alert("Erro ao deletar item");
        return;
      }

      fetchPageSpies();
    } catch {
      alert("Erro ao conectar com o servidor");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setPath("");
    setType("TEXT");
    setTextString("");
    setFileBase64("");
    setFormError("");
  };

  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar PageSpy
          </h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Novo Item
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Editar Item" : "Novo Item"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Path *
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="/comprovante-banco-xxxx"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "TEXT" | "IMAGE")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {enumPageSpyType.map((t) => (
                    <option key={t} value={t}>
                      {enumPageSpyTranslation[t]}
                    </option>
                  ))}
                </select>
              </div>

              {type === "TEXT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Texto *
                  </label>
                  <textarea
                    value={textString}
                    onChange={(e) => setTextString(e.target.value)}
                    rows={4}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {type === "IMAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Imagem *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required={!editingId}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                  {fileBase64 && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileBase64}
                      alt="Preview"
                      className="mt-2 max-w-xs rounded-md"
                    />
                  )}
                </div>
              )}

              {formError && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{formError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {formLoading ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : pageSpies.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum item cadastrado
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageSpies.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {
                        enumPageSpyTranslation[
                          item.type as keyof typeof enumPageSpyTranslation
                        ]
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() =>
                          router.push(`/admin/page-spy/${item.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {item._count.views} visualizações
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
