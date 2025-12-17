module.exports = {
  apps: [
    {
      name: "recruit-planner-backend",
      script: "npm",
      args: "start",
      cwd: "./",
      env: {
        NODE_ENV: "production",
        PORT: 3322,
      },
    },
  ],
};
