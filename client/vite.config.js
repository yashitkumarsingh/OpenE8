import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'src/main.jsx',
        'src/setupTests.js',
        'src/App.jsx',
        'src/components/evidence/EvidenceModal.jsx',
        'src/components/evidence/ImporterPanel.jsx',
        'src/components/exceptions/ExceptionModal.jsx',
        'src/components/remediation/RemediationModal.jsx',
        'src/components/evidence/EvidenceGraph.jsx',
        'src/components/reports/ReportsTab.jsx',
        'src/components/dashboard/DashboardTab.jsx',
        'src/components/assessment/AssessmentWorkspace.jsx'
      ]
    }
  }
});
