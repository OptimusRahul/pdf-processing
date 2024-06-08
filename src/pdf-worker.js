/* eslint-disable no-restricted-globals */
import * as pdfjsLib from "pdfjs-dist";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = WorkerMessageHandler;

const pendingRenders = {};

self.onmessage = async (e) => {
  if (e.data.type === "renderPageResult") {
    const { pageIndex, blob } = e.data;
    const resolve = pendingRenders[pageIndex];
    if (resolve) {
      resolve(blob);
      delete pendingRenders[pageIndex];
    }
    return;
  }

  if (e.data.type === "renderPageResult") {
    const { pageIndex, blob } = e.data;
    const resolve = pendingRenders[pageIndex];
    if (resolve) {
      resolve(blob);
      delete pendingRenders[pageIndex];
    }
    return;
  }

  const { arrayBuff, password } = e.data;

  const startTime = Date.now();
  try {
    // Assuming pdfjsLib is passed correctly, which in practice, you need to import it within the worker scope
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuff, password }).promise;
    const numPages = pdfDoc.numPages;
    postMessage({ images: [], start: 0, end: 50, size: numPages });
    const batchSize = 50;

    for (let start = 1; start <= numPages; start += batchSize) {
      const end = Math.min(start + batchSize - 1, numPages);
      const batchImages = await processPagesBatch(pdfDoc, start, end);
      postMessage({ images: batchImages, start, end, size: numPages });
    }

    console.log(`Took ${Date.now() - startTime}ms to convert pdf of ${numPages} pages.`);
  } catch(error) {
      if (error.name === 'PasswordException') {
        postMessage({ type: 'needPassword', errorCode: error.code });
      } else {
        postMessage({ type: 'error', error });
      }
  }
};

async function processPagesBatch(pdfDoc, startPage, endPage) {
  const totalPages = Math.abs(endPage - startPage) + 1;
  const imagePromise = Array.from({ length: totalPages }, async (_, pageIndex) => {
    const page = await pdfDoc.getPage(startPage + pageIndex);
    const scale = 1.3;
    const viewport = page.getViewport({ scale });

    try {
      // Use OffscreenCanvas if supported
      const canvas = new OffscreenCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.convertToBlob({ type: "image/png" });
    } catch (error) {
      // Send page data to the main thread to render on a regular canvas
      const data = {
        type: "renderPage",
        pageIndex: startPage + pageIndex,
        viewport: { width: viewport.width, height: viewport.height, scale },
      };
      postMessage(data);

      return new Promise((resolve) => {
        pendingRenders[startPage + pageIndex] = resolve;
      });
    }
  });

  return await Promise.all(imagePromise);
}
