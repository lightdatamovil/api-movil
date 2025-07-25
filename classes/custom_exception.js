import Status from "./status.js";

export default class CustomException extends Error {
  /**
   * @param {string} title - The title of the error.
   * @param {string} message - The error message.
   * @param {string} [stack] - The stack trace of the error (optional).
   */
  constructor({ title, message, stack, status = Status.internalServerError }) {
    super(message);
    this.title = title;
    this.message = message;
    this.stack = stack;
    this.status = status;
  }
  toJSON() {
    return {
      title: this.title,
      message: this.message,
      stack: this.stack,
    };
  }
  toJsonString() {
    return JSON.stringify({
      title: this.title,
      message: this.message,
      stack: this.stack,
    });
  }
}
