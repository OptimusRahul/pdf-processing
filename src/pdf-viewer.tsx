import { useState } from 'react';

export const PDFViewer = ({ pageImages }: {pageImages: string[]}) => {
  // State to keep track of the currently selected page
  const [selectedPage, setSelectedPage] = useState(0);

  return (
    <div>
      <div>
        {pageImages.map((_, index) => (
          <button key={index} onClick={() => setSelectedPage(index)}>
            Page {index + 1}
          </button>
        ))}
      </div>
      <div>
        {pageImages.length > 0 && (
          <img src={pageImages[selectedPage]} alt={`Page ${selectedPage + 1}`} />
        )}
      </div>
    </div>
  );
};