"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface IpApiResponse {
  status: string;
  continent?: string;
  continentCode?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  district?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  offset?: number;
  currency?: string;
  isp?: string;
  org?: string;
  as?: string;
  asname?: string;
  mobile?: boolean;
  proxy?: boolean;
  hosting?: boolean;
  query?: string;
}

interface IpInfoProps {
  ip: string;
}

export function IpInfo({ ip }: IpInfoProps) {
  const [ipData, setIpData] = useState<IpApiResponse | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHovered && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isHovered]);

  const fetchIpInfo = async () => {
    if (ipData || loading) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `/api/admin/ip-info/${encodeURIComponent(ip)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar informações do IP");
      }

      const result = await response.json();
      setIpData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      console.error("Error fetching IP info:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    fetchIpInfo();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-help underline decoration-dotted"
      >
        {ip}
      </span>

      {mounted &&
        isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-xl"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {loading && (
              <div className="text-sm text-gray-600">
                Carregando informações...
              </div>
            )}

            {error && <div className="text-sm text-red-600">Erro: {error}</div>}

            {ipData && ipData.status === "success" && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 border-b pb-2">
                  Informações do IP: {ipData.query}
                </div>

                {ipData.country && (
                  <div>
                    <span className="font-medium text-gray-700">País:</span>{" "}
                    <span className="text-gray-600">
                      {ipData.country} ({ipData.countryCode})
                    </span>
                  </div>
                )}

                {ipData.regionName && (
                  <div>
                    <span className="font-medium text-gray-700">Região:</span>{" "}
                    <span className="text-gray-600">{ipData.regionName}</span>
                  </div>
                )}

                {ipData.city && (
                  <div>
                    <span className="font-medium text-gray-700">Cidade:</span>{" "}
                    <span className="text-gray-600">{ipData.city}</span>
                  </div>
                )}

                {ipData.isp && (
                  <div>
                    <span className="font-medium text-gray-700">ISP:</span>{" "}
                    <span className="text-gray-600">{ipData.isp}</span>
                  </div>
                )}

                {ipData.org && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Organização:
                    </span>{" "}
                    <span className="text-gray-600">{ipData.org}</span>
                  </div>
                )}

                {ipData.as && (
                  <div>
                    <span className="font-medium text-gray-700">AS:</span>{" "}
                    <span className="text-gray-600">{ipData.as}</span>
                  </div>
                )}

                {ipData.timezone && (
                  <div>
                    <span className="font-medium text-gray-700">Timezone:</span>{" "}
                    <span className="text-gray-600">{ipData.timezone}</span>
                  </div>
                )}

                {ipData.lat !== undefined && ipData.lon !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Coordenadas:
                    </span>{" "}
                    <span className="text-gray-600">
                      {ipData.lat.toFixed(4)}, {ipData.lon.toFixed(4)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t space-y-1">
                  {ipData.mobile !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Mobile:</span>{" "}
                      <span className="text-gray-600">
                        {ipData.mobile ? "Sim" : "Não"}
                      </span>
                    </div>
                  )}

                  {ipData.proxy !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">Proxy:</span>{" "}
                      <span className="text-gray-600">
                        {ipData.proxy ? "Sim" : "Não"}
                      </span>
                    </div>
                  )}

                  {ipData.hosting !== undefined && (
                    <div>
                      <span className="font-medium text-gray-700">
                        Hosting:
                      </span>{" "}
                      <span className="text-gray-600">
                        {ipData.hosting ? "Sim" : "Não"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {ipData && ipData.status === "fail" && (
              <div className="text-sm text-red-600">
                Não foi possível obter informações para este IP
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
