module.exports = {
  apps: [
    {
      name: "api-server",
      script: "./index.js",  // Adjust this path to your entry point
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
