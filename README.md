# PDF Processing in React with Web Workers

This project demonstrates a practical approach to processing and rendering PDF documents in a React application. It leverages Web Workers to offload the heavy lifting of PDF processing, ensuring the UI remains responsive. The application allows users to upload PDF files and view them within the browser, rendering pages in batches for efficiency.

## Features

- **Batch Processing**: PDF pages are processed and rendered in batches to improve load times and application responsiveness.
- **Web Worker Integration**: Offloads PDF processing to a background thread, preventing UI freezes during heavy computations.
- **React-based UI**: Utilizes React for a dynamic and responsive user interface.
- **PDF.js Library**: Leverages the powerful `pdfjs-dist` library for handling PDF files.

## Future Enhancements

- **Dynamic Page Prioritization**: *(To be implemented)* Dynamically adjust the processing priority of PDF pages based on user interactions, such as scrolling. This will ensure that pages in the user's viewport or near it are rendered first for a smoother reading experience.

## Getting Started

### Prerequisites

Ensure you have Node.js (version 12 or higher) installed on your system to manage project dependencies and run the development server.

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/OptimusRahul/pdf-processing.git
