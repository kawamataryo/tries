import { defineConfig } from 'orval';

export default defineConfig({
  'todo-api': {
    input: '../shared/openapi.yaml',
    output: {
        mode: 'split',
        target: 'src/orval-generated',
        schemas: 'src/orval-generated/schemas',
        client: 'react-query',
        httpClient: 'fetch',
        baseUrl: 'http://localhost:8080',
        mock: true,
    },
  },
});
