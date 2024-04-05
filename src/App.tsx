import React, { useState, ChangeEvent, useEffect } from 'react';

import * as pdfjsLib from "pdfjs-dist";
import { WorkerMessageHandler } from "pdfjs-dist/build/pdf.worker.mjs";

import { PDFViewer } from './pdf-viewer';
import './App.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = WorkerMessageHandler;

const worker = new Worker(new URL('./pdf-worker.js', import.meta.url), { type: 'module' });

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageBase64, setPageBase64] = useState<string[]>([]);

  useEffect(() => {
    worker.onmessage = (e) => {
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
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    const buffer = await (selectedFile as File).arrayBuffer();
    worker.postMessage({ arrayBuff: buffer });
  };

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
