/**
 * PM2 process file for Ubuntu + Nginx reverse proxy (no Docker).
 * Usage: pm2 start ecosystem.config.cjs
 * Set env vars in /etc/environment, a systemd drop-in, or pm2 ecosystem `env_production`.
 */
module.exports = {
  apps: [
    {
      name: "mpcpct-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "900M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
