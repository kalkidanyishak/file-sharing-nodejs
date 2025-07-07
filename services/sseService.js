// services/sseService.js

let clients = [];

/**
 * The Express handler for establishing an SSE connection.
 */
const sseHandler = (req, res) => {
  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // Flush the headers to establish the connection

  // Send an initial event to acknowledge the connection
  res.write("data: Connection established\n\n");

  // Store the new client
  clients.push(res);
  console.log("New SSE client connected.");

  // Remove the client when they close the connection
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    console.log("SSE client disconnected.");
  });
};

/**
 * Broadcasts a message to all connected SSE clients.
 * @param {object} data The data object to send.
 */
const broadcast = (data) => {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach((client) => client.write(message));
};

/**
 * A standard message to broadcast when data is updated.
 */
const broadcastUpdate = () => {
    broadcast({
        event: "data-retrieved",
        timestamp: new Date(),
    });
};

module.exports = {
  sseHandler,
  broadcastUpdate,
};