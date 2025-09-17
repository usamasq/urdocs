# Urdu Document Editor (UrDocs)

A professional, enterprise-grade Urdu document editor built with React, TypeScript, and TipTap. Features a revolutionary **Professional Layout Engine** with advanced typography, multi-column layouts, headers, footers, and precise document formatting. Designed specifically for RTL (Right-to-Left) text editing with comprehensive Urdu keyboard layouts.

## 🌟 Features

### ✨ **Core Editing Features**
- **Rich Text Editing** - Bold, italic, underline, strikethrough formatting
- **Advanced Typography** - 40+ Urdu, Arabic, and Persian fonts
- **RTL Support** - Native right-to-left text direction
- **Multiple Keyboard Layouts** - Phonetic, InPage, and CRULP layouts
- **Real-time Preview** - Live document preview with page simulation

### 📄 **Professional Layout Engine**
- **Proactive Layout** - Calculates document layout before rendering
- **Multi-column Support** - Advanced column layouts with balanced content
- **Headers & Footers** - Professional page numbering and document headers
- **Typography Rules** - Orphan/widow control, hyphenation, and text flow
- **Content Handlers** - Specialized handling for tables, images, lists, and more
- **Performance Optimized** - Debounced calculations and memoized results

### 📄 **Document Management**
- **Page Setup** - A4, Letter, and custom page sizes
- **Margin Control** - Visual margin guides with ruler system
- **Zoom Controls** - 25% to 300% zoom range
- **Multi-page Support** - Automatic page flow and pagination
- **Print Optimization** - Perfect print and PDF export
- **Layout Toggle** - Switch between Professional and Legacy systems

### 🎨 **User Experience**
- **Dark/Light Theme** - Automatic theme switching
- **Bilingual Interface** - English and Urdu UI
- **Responsive Design** - Works on desktop and mobile
- **Accessibility** - Full ARIA compliance and keyboard navigation
- **Error Handling** - Graceful error recovery with user feedback

### 🔧 **Technical Features**
- **TypeScript** - Full type safety and IntelliSense
- **Performance Optimized** - React.memo, useCallback, and memoization
- **Modular Architecture** - Clean component separation
- **Error Boundaries** - Comprehensive error handling
- **Modern Build** - Vite with optimized bundling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd urdocs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## 📖 Usage Guide

### Basic Editing

1. **Start Typing** - The editor opens with sample Urdu text
2. **Select Font** - Choose from 40+ available fonts in the toolbar
3. **Format Text** - Use bold, italic, underline, and alignment tools
4. **Adjust Size** - Change font size using the size selector

### Keyboard Layouts

Switch between three Urdu keyboard layouts:

- **Phonetic** - Type Urdu using English phonetic sounds
- **InPage** - Traditional InPage keyboard mapping
- **CRULP** - Center for Research in Urdu Language Processing layout

### Page Setup

1. **Open Page Setup** - Click the settings icon in the toolbar
2. **Choose Page Size** - Select A4, Letter, or custom dimensions
3. **Set Margins** - Adjust margins using the visual ruler system
4. **Toggle Guides** - Show/hide margin guides for precise layout

### Export Options

- **Print** - Direct printing with perfect formatting
- **PDF Export** - High-quality PDF generation
- **Page Preview** - Real-time page simulation

## 🏗️ Architecture

### Project Structure

```
src/
├── components/           # React components
│   ├── toolbar/         # Modular toolbar components
│   ├── ui/              # Reusable UI components
│   └── ...
├── contexts/            # React contexts
│   ├── LanguageContext.tsx
│   ├── ThemeContext.tsx
│   └── PaginationContext.tsx
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── constants/           # Application constants
└── lib/                 # Third-party library configurations
```

### Key Components

- **UrduEditor** - Main application component with layout toggle
- **EditorToolbar** - Modular toolbar system with professional layout controls
- **IntegratedProfessionalEditor** - Professional layout engine integration
- **MultiPageEditor** - Legacy multi-page editor (fallback)
- **PageSetupSidebar** - Page configuration panel
- **ErrorBoundary** - Error handling component

### State Management

- **LanguageContext** - UI language and translations
- **ThemeContext** - Dark/light theme management
- **ProfessionalPaginationContext** - Professional layout engine state
- **SimplePaginationContext** - Legacy pagination state (fallback)

## 🎨 Customization

### Adding New Fonts

1. **Update Constants** - Add font to `src/constants/index.ts`
2. **Update Tailwind** - Add font family to `tailwind.config.js`
3. **Import Font** - Add Google Fonts import to `src/index.css`

### Adding New Keyboard Layouts

1. **Create Layout** - Add mapping to `src/utils/keyboardLayouts.ts`
2. **Update Types** - Add layout type to `src/types/index.ts`
3. **Update UI** - Add option to layout selector

### Customizing Themes

Themes are managed through CSS custom properties in `src/index.css`. Modify the `:root` and `.dark` selectors to customize colors.

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Quality

- **ESLint** - Configured with TypeScript and React rules
- **TypeScript** - Strict mode enabled
- **Prettier** - Code formatting (recommended)

### Performance

The application is optimized for performance with:

- **React.memo** - Prevents unnecessary re-renders
- **useCallback** - Memoizes event handlers
- **useMemo** - Memoizes expensive calculations
- **Code Splitting** - Optimized bundle chunks

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📱 Mobile Support

The editor is responsive and works on mobile devices with touch support for:

- Text editing and formatting
- Font and size selection
- Page setup and margins
- Export functionality

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   npm run build
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful component and variable names
- Add JSDoc comments for complex functions
- Ensure accessibility compliance
- Test on multiple browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TipTap** - Rich text editor framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Google Fonts** - Typography resources
- **Urdu Typography Community** - Font and layout contributions

## 📞 Support

For support, feature requests, or bug reports:

1. **Check existing issues** - Search GitHub issues first
2. **Create new issue** - Provide detailed description and steps to reproduce
3. **Join discussions** - Participate in GitHub discussions

## 📚 Documentation

### Technical Documentation
- **[Professional Layout System](PROFESSIONAL_LAYOUT_SYSTEM.md)** - Comprehensive guide to the new layout engine architecture
- **[Deployment Guide](DEPLOYMENT.md)** - GitHub Pages deployment instructions

### Architecture Overview
The application features a revolutionary Professional Layout Engine with:
- **Proactive Layout Calculation** - Layout calculated before rendering for optimal performance
- **Multi-Content Support** - Specialized handlers for paragraphs, tables, images, lists, and more
- **Advanced Typography** - Orphan/widow control, hyphenation, and professional text flow
- **Extensible Architecture** - Easy to add new content types and layout features
- **Performance Optimization** - Debounced calculations, memoization, and efficient rendering

## 🔮 Roadmap

### Planned Features
- [ ] **Advanced Content Types** - Forms, interactive elements, media integration
- [ ] **Collaborative Editing** - Real-time multi-user editing with conflict resolution
- [ ] **Document Templates** - Predefined layouts and professional document templates
- [ ] **Export Formats** - Advanced PDF, DOCX, RTF, and LaTeX export
- [ ] **Plugin Architecture** - Custom content handlers and layout extensions
- [ ] **Cloud Integration** - Google Drive, Dropbox, and OneDrive sync
- [ ] **Offline Support** - Progressive Web App with offline editing capabilities

### Performance Improvements
- [ ] **Web Workers** - Background processing for layout calculations
- [ ] **Virtual Scrolling** - Efficient rendering of large documents
- [ ] **Progressive Rendering** - Incremental page loading for better UX
- [ ] **Memory Optimization** - Advanced memory management for mobile devices
- [ ] **WebAssembly** - High-performance text processing and layout algorithms

---

**Built with ❤️ for the Urdu language community**