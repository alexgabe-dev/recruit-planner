module.exports = {
  apps: [
    {
      name: "recruit-planner-backend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Ensure these are set in your environment or .env file
        // AUTH_SECRET: "...", 
      },
    },
  ],
};
