import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      // Keep /*! ... */ comments: the SCOWL licence requires its notice in all copies.
      output: { comments: { legal: true } },
    },
  },
});
