import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';

import { PDFViewer } from './pdf-viewer';
import './App.css';

import * as pdfjsLib from "pdfjs-dist";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = WorkerMessageHandler;

const worker = new Worker(new URL('./pdf-worker.js', import.meta.url), { type: 'module' });

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageBase64, setPageBase64] = useState<string[]>([]);

  const handleFallback = useCallback(async (pageIndex: number) => {
    const arrayBuffer = await (selectedFile as File).arrayBuffer();

    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdfDoc.getPage(pageIndex);
    const viewport = page.getViewport({ scale: 1.3 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context!, viewport }).promise;

    canvas.toBlob((blob) => {
      worker.postMessage({ type: "renderPageResult", pageIndex, blob });
    }, "image/png");

  }, [selectedFile])

  const handlePasswordException = useCallback(async () => {
    const password = prompt("This PDF is password protected. Please enter the password:");
    if (password) {
      const buffer = await (selectedFile as File).arrayBuffer();
      worker.postMessage({ arrayBuff: buffer, password });
    }
  }, [selectedFile])

  useEffect(() => {
    worker.onmessage = async (e) => {

      if (e.data.type === "renderPage") {
        const { pageIndex } = e.data;
        handleFallback(pageIndex);
        return;
      }
      
      if (e.data.type === "needPassword") {
        handlePasswordException();
        return
      } 

      if (e.data.type === "error") {
        console.error("Error in PDF processing:", e.data.error);
        prompt('Error in PDF processing.')
        return;
      }

      const { images = [], start, size } = e.data;

      // Early return if size is not defined
      if (!size) return;

      setPageBase64(prev => {
        // Initialize or ensure the array is of the correct size with nulls
        const updatedArray = prev.length === size ? [...prev] : new Array(size).fill(null);
        // Map each blob URL into the correct position based on its batch start index
        images.forEach((blob: Blob, index: number) => {
          const blobUrl = URL.createObjectURL(blob);
          updatedArray[start + index - 1] = blobUrl; // Adjusting index since `start` is 1-based
        });
        return updatedArray;
      });
    };
  }, [handleFallback, handlePasswordException, selectedFile]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  }, [])

  const handleFileUpload = useCallback(async() => {
    const buffer = await (selectedFile as File).arrayBuffer();
    worker.postMessage({ arrayBuff: buffer });
  }, [selectedFile])

  return (
    <div className="App">
      <header className="App-header">
        <input type="file" onChange={handleFileChange} accept=".pdf" />
        <button onClick={handleFileUpload}>Upload PDF</button>
        {selectedFile && <p>File name: {selectedFile.name}</p>}
      </header>
      <PDFViewer pageImages={pageBase64} />
    </div>
  );
};

export default App;
