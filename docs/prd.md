# Prism-Extract Requirements Document

## 1. Application Overview

### 1.1 Application Name
Prism-Extract (Image Color Extractor & CSS Gradient Generator)

### 1.2 Application Description
A high-performance, single-page application (SPA) built with Next.js and Shadcn UI. It enables designers and developers to upload images, extract refined color palettes using browser-side quantization, and manipulate those colors into complex CSS gradients via interactive sliders and direct-preview manipulation.

### 1.3 Core Purpose\nTo bridge the gap between visual inspiration (images) and technical implementation (CSS), providing a privacy-first, zero-server-load tool for web developers.

## 2. Core Functionality

### 2.1 Advanced Image Processing
- **Upload**: Drag-and-drop or click-to-select using Shadcn Input and Card components\n- **Privacy**: 100% client-side processing via Canvas API; no image data leaves the user's browser
- **Formats**: Full support for JPG, PNG, GIF, and WebP

### 2.2 Intelligent Color Extraction
- **Quantization**: Analyze images to extract 5–8 dominant colors
- **Swatch Management**: Each color displayed as an interactive Badge; users can toggle colors on/off to include them in the gradient\n
### 2.3 Precision Gradient Engine
- **Angle Control**: 0° to 360° Shadcn Slider to define linear flow
- **Distance/Stop Control**: Independent sliders for each color to define its percentage position (0% to 100%) along the gradient axis\n- **Live Interaction**: Click-and-drag functionality directly on the Preview area to intuitively change the gradient angle

### 2.4 Production-Ready Export
- **Code Generation**: Real-time formatting of background: linear-gradient(...)
- **One-Click Copy**: Integrated Clipboard API with Shadcn Toast notifications for success feedback

## 3. UI Components (Shadcn UI Specification)

| Component | UI Implementation | Functionality |
|-----------|------------------|---------------|
| Dropzone | Card + UploadIcon | Dashed border area with hover-state highlighting |
| Gradient Preview | Custom div w/ Shadow | Real-time rendering; responds to clicks for angle adjustment |\n| Control Panel | Tabs (Basic/Advanced) | 'Basic' for quick extraction; 'Advanced' for stop/angle sliders |
| Angle Slider | Slider + Input | Dual-synced inputs for fine-tuning degrees |
| Color Stops | Accordion | Expandable rows containing color swatches and their distance sliders |
| Output Box | Code component | Monospace text in a scrollable, read-only container |

## 4. Technical Requirements

### 4.1 Performance & Architecture
- **Framework**: Next.js 14+ (App Router) for optimized performance\n- **Worker Threads**: (Optional/Recommended) Use a Web Worker for color quantization to ensure the UI remains responsive (60 fps) during heavy image analysis
- **State Management**: React useState and useMemo to prevent unnecessary re-renders of the gradient preview

### 4.2 User Experience (UX)
- **Responsive**: Grid-based layout (1-column on mobile, 2-column on desktop)
- **Accessibility**: Full keyboard navigation support for sliders and buttons; ARIA labels for all color swatches
- **Visual Feedback**: Smooth CSS transitions (200ms) when colors or angles change

## 5. Design Style\n
### 5.1 Design System
- **Theme**: Modern, clean 'SaaS' aesthetic
- **Primary Color**: Shadcn Primary (#4A90E2) for active states and action buttons
- **Surface Colors**: Light neutral gray (#F5F7FA) for page background; pure white (#FFFFFF) for component cards
- **Typography**: Sans-serif (Inter/Geist) for UI; Monospace (JetBrains Mono/Fira Code) for CSS output

### 5.2 Layout Structure
- **Header**: Minimalist logo and theme toggle
- **Main Workspace**:
  - Left/Top: Image Upload & Palette Extraction\n  - Right/Bottom: Live Preview, Sliders, and Code Export
- **Spacing**: Generous use of gap-8 (Tailwind) to prevent visual clutter