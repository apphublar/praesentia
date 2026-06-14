/** Baixa a capa do convite (data URL, blob ou URL same-origin). */
export async function downloadCoverImage(url: string, filename = "convite-praesentia.png") {
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    triggerDownload(url, filename);
    return;
  }

  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error("Não foi possível baixar a imagem.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerDownload(objectUrl, filename);
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

function triggerDownload(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
