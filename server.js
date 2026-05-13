/* Optional custom server to enable Socket.IO without changing Next APIs.
   Run: npm run dev:socket
*/
const http = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const server = http.createServer((req, res) => handle(req, res));
  const allowedOrigins = (process.env.SOCKET_IO_ALLOWED_ORIGINS ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: (origin, cb) => {
        if (!origin) {
          cb(null, true);
          return;
        }
        if (allowedOrigins.length === 0) {
          if (dev) {
            cb(null, true);
            return;
          }
          console.error(
            "Set SOCKET_IO_ALLOWED_ORIGINS or NEXT_PUBLIC_SITE_URL for Socket.IO CORS in production"
          );
          cb(new Error("CORS not configured"), false);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          cb(null, true);
          return;
        }
        cb(new Error("Not allowed by CORS"), false);
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_doubt", ({ doubtId }) => {
      if (doubtId) socket.join(String(doubtId));
    });
    socket.on("leave_doubt", ({ doubtId }) => {
      if (doubtId) socket.leave(String(doubtId));
    });
  });

  // Simple broadcast endpoint: other APIs can POST to it later if desired.
  // For now clients can use polling; socket is ready for future push.

  server.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT} (socket enabled)`);
  });
});

