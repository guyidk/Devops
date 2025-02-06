module.exports = {
  apps: [
    {
      name: "BookTrak",
      script: "index.js", // Directly runs your main application script
      watch:["models", "public", "utils", "index.js"]
    },
  ],
};


