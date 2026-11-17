# CloudPix — Cloudinary Digital Asset Management & Dynamic Transformation Studio

> An engineering-grade Digital Asset Management (DAM) system and dynamic media transformation studio powered by Next.js 14, TypeScript, Tailwind CSS, and Cloudinary.

Inspired by the design restraint, typographic discipline, and density of **Linear, Raycast, and Dropbox**, CloudPix treats media transformation and asset management as precision developer tooling rather than a generic marketing portal.

---

## Key Capabilities

### 1. Dynamic Cloudinary Transformation Studio
- **Interactive Split Slider**: Draggable real-time divider comparing the original image against the Cloudinary transformed output.
- **1-Click Production Presets**:
  - *Smart Retina Avatar* (`c_thumb,g_face,r_max,f_auto,q_auto:best`)
  - *OpenGraph (OG) 1200×630* (`c_fill,g_auto,f_auto,q_auto:good`)
  - *E-Commerce Square Pad* (`c_pad,b_white,f_auto,q_auto`)
  - *Responsive Hero Banner* (`w_1920,c_limit,f_auto,q_auto:best,e_sharpen:60`)
  - *Mobile Feed Card* (`w_800,h_1000,c_fill,g_auto,r_16,f_auto`)
  - *Technical Noir Monochrome* (`e_grayscale,c_fill`)
- **Fine-Grained Geometry Controls**:
  - Resizing modes: `fill`, `fit`, `crop`, `scale`, `pad`, `thumb`.
  - Gravity modes: AI Face Detection (`g_face`), AI Subject Detection (`g_auto`), multi-face, directional coordinates.
  - Quick aspect ratio locks: `1:1`, `16:9`, `4:5`, `4:3`.
- **Bandwidth & Data Savings Calculator**: Live estimation of byte reduction and compression efficiency (e.g. `1.8 MB → 270 KB (-85%)`).
- **Code Snippet Generator**: Export ready-to-use code in 5 formats:
  - Clean Cloudinary CDN URL
  - HTML `<img>` tag with `loading="lazy"` and `decoding="async"`
  - Next.js `<Image />` component with responsive dimensions
  - React Cloudinary `<CldImage />` component
  - Markdown image embed

### 2. High-Density Asset Library (DAM)
- **Grid View & Table View**: Seamless toggle between rich visual cards and an engineering tabular view with sortable columns.
- **Live Search & Filtering**: Instant client-side fuzzy search across filenames, public IDs, and tags, alongside format chips (JPG, PNG, WebP, AVIF) and folder segmentation.
- **Batch Operations**: Multi-select assets to batch copy CDN URLs or batch delete.

### 3. Slide-Over Asset Inspector Drawer
- Full technical metadata: Dimensions, aspect ratio, file size, public ID, secure CDN URL, creation timestamp, folder, and tags.
- **Color Palette Extraction**: Interactive dominant color swatches with one-click HEX code copying.
- Direct "Launch in Transformation Studio" CTA.

### 4. Cloudinary Verification & Multi-Mode Environment
- Real-time connection test via `/api/cloudinary/verify` measuring CDN ping latency.
- Seamless dual-mode:
  - **Demo Playground**: Instant zero-config access using Cloudinary's global public demo cloud with 100% active dynamic edge transforms.
  - **Custom Cloudinary Account**: In-app configuration of Cloud Name, API Key, API Secret, and Upload Preset, with real Admin & Upload API operations.

### 5. Keyboard Navigation & Command Palette (`⌘K` / `Ctrl+K`)
- `⌘K` or `Ctrl+K`: Global command palette to search assets, trigger uploads, toggle views, or switch themes.
- `G`: Switch to Grid view.
- `L`: Switch to Table / List view.
- `U`: Open media uploader modal.
- `Esc`: Close open drawers and modals.

---

## Architecture & Technology Stack

| Component | Technology |
|---|---|
| Framework | **Next.js 14.2 (App Router)** |
| Language | **TypeScript (Strict mode, zero `any`)** |
| Styling | **Tailwind CSS (Custom neutral HSL token system)** |
| Typography | **Geist Sans & Geist Mono (Vercel)** |
| Iconography | **Lucide React** |
| CDN & Transformations | **Cloudinary SDK (`cloudinary` v2) + Dynamic CDN URLs** |

---

## Getting Started

### Development Server
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

### Environment Configuration (Optional)
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
*Note: Credentials can also be configured and verified directly in the UI via the status pill in the top navigation bar without restarting the server.*

---

## Design Standards & Philosophy
- **Restraint Over Excess**: Zero gratuitous glow effects, neon accents, or 20px blur glassmorphism.
- **Precision Alignment**: 1px crisp borders, 6px subtle radii (`rounded-md`), and high typographic hierarchy.
- **Visual Feedback**: Instant state transitions (150ms ease), non-blocking toasts, and informative latency metrics.
