/*
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    port: 4478,     // ⬅ 원하는 포트
    host: true,     // ⬅ 외부 접속 허용 (SSH에서도 접속 가능)
  },
})
*/

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4478,
    host: true,
  },
})
