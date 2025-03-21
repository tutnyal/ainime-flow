import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import {
  API_ROUTES,
  BASENAME,
  PORT,
  PROXY_TARGET,
} from "./src/customization/config-constants";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const apiRoutes = API_ROUTES || ["^/api/v1/", "/health"];

  const target =
  env.VITE_PROXY_TARGET || PROXY_TARGET || "https://comfydeploy-osv-delicate-resonance-8920.fly.dev" || "http://127.0.0.1:7860";

  const port = Number(env.VITE_PORT) || PORT || 3000 || 3001;

  const proxyTargets = apiRoutes.reduce((proxyObj, route) => {
    proxyObj[route] = {
      target: target,
      changeOrigin: true,
      secure: false,
      ws: true,
    };
    return proxyObj;
  }, {});

  return {
    base: BASENAME || "",
    build: {
      outDir: "dist",
    },
    define: {
      "process.env.BACKEND_URL": JSON.stringify(env.BACKEND_URL),
      "process.env.ACCESS_TOKEN_EXPIRE_SECONDS": JSON.stringify(
        env.ACCESS_TOKEN_EXPIRE_SECONDS,
      ),
      "process.env.CI": JSON.stringify(env.CI),
    },
    plugins: [react(), svgr(), tsconfigPaths()],
    server: {
      port: port,
      proxy: {
        // Add proxy for ComfyDeploy API
        '/comfy-api': {
          target: 'https://comfydeploy-osv.vercel.app',
          // target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/comfy-api/, '/api'),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Log outgoing request
              console.log('Sending Request:', req.method, req.url);
              
              // Explicitly copy the authorization header
              const authHeader = req.headers['authorization'];
              if (authHeader) {
                proxyReq.setHeader('Authorization', authHeader);
                console.log('Setting Authorization header:', authHeader);
              } else {
                // If no auth header in the request, add the token directly
                proxyReq.setHeader('Authorization', `Bearer ${process.env.COMFY_API_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidXNlcl8yam1VRFI4c3ZwbUU0UkRCMDRLT2ZwbTVUWTMiLCJpYXQiOjE3NDA4Njk4MDF9.hHDkE41WWLZdNhl7NXGFGHvKBy8KacV9dUkiSVxTYaE'}`);
                console.log('Added default Authorization header');
              }
              
              // Ensure content-type is set
              if (!proxyReq.getHeader('Content-Type')) {
                proxyReq.setHeader('Content-Type', 'application/json');
              }

              // Add CORS headers
              proxyReq.setHeader('Access-Control-Allow-Origin', '*');
              proxyReq.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
              proxyReq.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response:', proxyRes.statusCode, req.url);
              
              // Log headers for debugging
              console.log('Response headers:', proxyRes.headers);
            });
          },
        },
        ...proxyTargets,
      },
      // Add CORS headers to all responses
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      }
    },
  };
});
