class CustomException extends Error {
    /**
     * @param {string} title - The title of the error.
     * @param {string} message - The error message.
     * @param {string} [stack] - The stack trace of the error (optional).
     */
    constructor({ title, message, stack = '' }) {
      super(message);
      this.title = title;
      this.message = message;
      this.stack = stack || (new Error()).stack; // If no stack is provided, use the default stack trace
    }
  }
  
  module.exports = CustomException; // Exporting the class for usage in other files
  