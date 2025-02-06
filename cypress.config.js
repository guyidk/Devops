const { defineConfig } = require("cypress");
const { spawn } = require("child_process");
let server;
let baseUrl;
module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      config.browsers = [
        ...config.browsers,
        {
          name: "opera",
          family: "chromium",
          channel: "stable",
          displayName: "Opera",
          version: "115.0.5322.68",
          majorVersion: "115", 
          path: "C:\\Users\\Rohith\\AppData\\Local\\Programs\\Opera\\opera.exe", // Path to Opera executable
        },
      ];

      require('@cypress/code-coverage/task')(on, config)
      on("task", {
        startServer() {
          return new Promise((resolve, reject) => {
            // Check if the server is already running
            if (server) {
              resolve(baseUrl);
            }
            server = spawn("node", ["-r", "nyc", "index-test.js"]);
            server.stdout.on("data", (data) => {
              console.log(data.toString()); // Log the output for debugging
              if (data.toString().includes("BookTrack app running at:")) {
                const baseUrlPrefix = "BookTrack app running at: ";
                const startIndex = data.toString().indexOf(baseUrlPrefix);
                if (startIndex !== -1) {
                  baseUrl = data.toString().substring(startIndex +
                    baseUrlPrefix.length).trim();
                  resolve(baseUrl);
                }
              }
            });
            server.stderr.on("data", (data) => {
              reject(data);
            });
          });
        },
        stopServer() {
          if (server) {
            server.kill();
          }
          return null;
        }, defaultCommandTimeout: 10000, // Increase timeout to 10 seconds
      });
      return config
    },
  }
});
