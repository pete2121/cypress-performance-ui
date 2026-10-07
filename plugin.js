const fs = require("fs");
const path = require("path");

function registerPerformancePlugin(on, config) {
  on("task", {
    readPerformanceHistory(filePath) {
      const absolutePath = path.resolve(
        config.projectRoot,
        filePath
      );

      if (!fs.existsSync(absolutePath)) {
        return [];
      }

      try {
        const content = fs.readFileSync(
          absolutePath,
          "utf8"
        );

        if (!content.trim()) {
          return [];
        }

        const data = JSON.parse(content);

        return Array.isArray(data)
          ? data
          : [];
      } catch (error) {
        throw new Error(
          `Unable to read performance history: ${error.message}`
        );
      }
    },

    clearPerformanceHistory(filePath) {
      const absolutePath = path.resolve(
        config.projectRoot,
        filePath
      );

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }

      return null;
    },
  });

  return config;
}

module.exports = {
  registerPerformancePlugin,
};

module.exports.default = registerPerformancePlugin;