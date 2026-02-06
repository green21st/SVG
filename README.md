# PolyCurve Studio

An interactive, web-based tool for drawing and smoothing SVG paths with real-time code generation.

## Features

-   **Interactive Drawing**: Click-to-add-point polyline drawing.
-   **Real-time Smoothing**: Adjustable tension (Catmull-Rom spline) for smooth curves.
-   **Symmetry Modes**: Horizontal, Vertical, and Center symmetry for complex shapes.
-   **Edit History**: Full Undo/Redo support.
-   **Export & Import**: Save your work as JSON to resume later, or export as optimized SVG.
-   **Code Preview**: Real-time SVG code generation for copy-pasting.
-   **Modern UI**: Dark-themed, tech-inspired interface built with Tailwind CSS.

## Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   npm or cnpm/yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    cnpm install
    ```

### Running Locally

Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

Build the project for deployment:
```bash
npm run build
```

The output will be in the `dist` directory.

## Usage Guide

1.  **Drawing**: Left-click on the canvas to place points.
2.  **Finishing a Path**: Right-click to complete the current path segment.
3.  **Smoothing**: Use the "Tension" slider in the toolbar to adjust curve smoothness.
4.  **Symmetry**: Select a symmetry mode (Horizontal/Vertical/Center) before drawing to create mirrored paths.
5.  **Saving**:
    -   **Save JSON**: Saves the raw point data (editable).
    -   **Export SVG**: Saves the final smoothed SVG image.
6.  **Loading**: Click "Load JSON" to restore a previously saved drawing session.

## Technologies

-   **React 18**: UI Framework
-   **TypeScript**: Type safety
-   **Vite**: Build tool
-   **Tailwind CSS**: Styling
-   **Lucide React**: Icons
