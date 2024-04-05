/* eslint-disable no-restricted-globals */
import * as pdfjsLib from "pdfjs-dist";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = WorkerMessageHandler;

self.onmessage = async (e) => {
  const { arrayBuff } = e.data;

  const startTime = Date.now();
  // Assuming pdfjsLib is passed correctly, which in practice, you need to import it within the worker scope
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuff }).promise;
  const numPages = pdfDoc.numPages;
  postMessage({images: [], start: 0, end: 50, size: numPages  })
  const batchSize = 50;

  for (let start = 1; start <= numPages; start += batchSize) {
    const end = Math.min(start + batchSize - 1, numPages);
    const batchImages = await processPagesBatch(pdfDoc, start, end);
    postMessage({ images: batchImages, start, end, size: numPages });
  }

  console.log(`Took ${Date.now() - startTime}ms to convert pdf of ${numPages} pages.`)
};

async function processPagesBatch(pdfDoc, startPage, endPage) {
  const totalPages = Math.abs(endPage - startPage) + 1;
  const imagePromise = Array.from({ length: totalPages }, async (_, pageIndex) => {
    const page = await pdfDoc.getPage(startPage + pageIndex);
    const scale = 1.3;
    const viewport = page.getViewport({ scale });
    // OffscreenCanvas for web workers, fallback or message to main thread might be needed
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;

    // Convert OffscreenCanvas to image
    return canvas.convertToBlob({ type: "image/png" });
  })

  const images = await Promise.all(imagePromise);

  return images;

}
