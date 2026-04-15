/**
 * Upload vers Supabase Storage via URL signée (PUT) avec suivi de progression.
 */

export function uploadWithProgress(
  file: File,
  signedUrl: string,
  onProgress: (loaded: number, total: number, speedBps: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let lastTime = Date.now();
    let lastLoaded = 0;

    xhr.upload.addEventListener("progress", (e) => {
      if (!e.lengthComputable) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      let speed = 0;
      if (dt > 0.2) {
        speed = (e.loaded - lastLoaded) / dt;
        lastTime = now;
        lastLoaded = e.loaded;
      }
      onProgress(e.loaded, e.total, speed);
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else
        reject(
          new Error(
            `Upload échoué (${xhr.status})`
          )
        );
    });
    xhr.addEventListener("error", () => reject(new Error("Erreur réseau")));
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}
