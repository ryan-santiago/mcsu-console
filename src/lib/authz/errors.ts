/** Typed errors that authedAction maps to ActionResult (docs/07-conventions.md). */

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/** A policy rule (R1–R15) refused the action. `rule` is for logs/tests; `message` is user-facing. */
export class PolicyError extends Error {
  readonly rule: string;
  constructor(rule: string, message: string) {
    super(message);
    this.name = "PolicyError";
    this.rule = rule;
  }
}
