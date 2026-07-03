const { app } = require("./app");

const port = Number(process.env.PORT) || 3001;

const server = app.listen(port, "127.0.0.1", () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or change PORT in .env.`,
    );
  } else {
    console.error("Failed to start API server:", error.message);
  }
  process.exit(1);
});
