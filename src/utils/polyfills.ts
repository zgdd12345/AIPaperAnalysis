/**
 * Polyfills for Zotero environment
 * Provides AbortController/AbortSignal for LLM SDK compatibility
 */

/**
 * Minimal AbortSignal implementation compatible with Fetch API
 */
class AbortSignalPolyfill extends EventTarget {
  private _aborted = false;
  private _reason: any = undefined;

  get aborted(): boolean {
    return this._aborted;
  }

  get reason(): any {
    return this._reason;
  }

  /**
   * Trigger abort event
   */
  abort(reason?: any): void {
    if (this._aborted) return;

    this._aborted = true;
    this._reason = reason || new Error("AbortError");

    // Dispatch abort event
    const event = new Event("abort");
    this.dispatchEvent(event);
  }

  /**
   * Create an already-aborted signal
   */
  static abort(reason?: any): AbortSignalPolyfill {
    const signal = new AbortSignalPolyfill();
    signal.abort(reason);
    return signal;
  }

  /**
   * Create a signal that aborts after timeout
   */
  static timeout(ms: number): AbortSignalPolyfill {
    const signal = new AbortSignalPolyfill();
    setTimeout(() => {
      signal.abort(new Error(`Timeout after ${ms}ms`));
    }, ms);
    return signal;
  }
}

/**
 * Minimal AbortController implementation compatible with Fetch API
 */
class AbortControllerPolyfill {
  private _signal: AbortSignalPolyfill;

  constructor() {
    this._signal = new AbortSignalPolyfill();
  }

  get signal(): AbortSignalPolyfill {
    return this._signal;
  }

  abort(reason?: any): void {
    this._signal.abort(reason);
  }
}

/**
 * Initialize polyfills in Zotero environment
 */
export function applyPolyfills(): void {
  const global = globalThis as any;

  // Check if AbortController is already available
  if (typeof global.AbortController === "undefined") {
    // Inject polyfill into global scope
    global.AbortController = AbortControllerPolyfill;
    global.AbortSignal = AbortSignalPolyfill;

    // Log for debugging
    if (typeof Zotero !== "undefined" && Zotero.debug) {
      Zotero.debug("[AIPaperAnalysis] AbortController polyfill initialized");
    }
  } else {
    // Already available (e.g., newer Zotero versions)
    if (typeof Zotero !== "undefined" && Zotero.debug) {
      Zotero.debug(
        "[AIPaperAnalysis] AbortController already available, skipping polyfill",
      );
    }
  }
}
