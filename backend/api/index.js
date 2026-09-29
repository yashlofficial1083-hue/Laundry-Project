const app = require("../index");
const { initializeAdminUser } = require("../src/controllers/auth.controller");

let initializationPromise;

module.exports = async (req, res) => {
  initializationPromise ??= initializeAdminUser();

  try {
    await initializationPromise;
    return app(req, res);
  } catch (error) {
    initializationPromise = undefined;
    console.error("Server initialization failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Server initialization failed",
    });
  }
};