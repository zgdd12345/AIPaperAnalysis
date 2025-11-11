import { BasicTool } from "zotero-plugin-toolkit";
import Addon from "./addon";
import packageJson from "../package.json";
import { applyPolyfills } from "./utils/polyfills";

const { config } = packageJson;

const basicTool = new BasicTool();

applyPolyfills();

const globalWithConsole = globalThis as typeof globalThis & { console?: any };
if (!globalWithConsole.console) {
  globalWithConsole.console = {
    log: (...args: any[]) => Zotero.debug(args.join(" ")),
    info: (...args: any[]) => Zotero.debug(args.join(" ")),
    warn: (...args: any[]) => Zotero.debug(args.join(" ")),
    error: (...args: any[]) => Zotero.logError(new Error(args.join(" "))),
    debug: (...args: any[]) => Zotero.debug(args.join(" ")),
    assert: (condition?: boolean, ...args: any[]) => {
      if (!condition) {
        Zotero.logError(new Error(args.join(" ")));
      }
    },
    clear: () => {},
    count: () => {},
    countReset: () => {},
    dir: () => {},
    dirxml: () => {},
    group: () => {},
    groupCollapsed: () => {},
    groupEnd: () => {},
    table: () => {},
    time: () => {},
    timeEnd: () => {},
    timeLog: () => {},
    trace: () => {},
    profile: () => {},
    profileEnd: () => {},
    timeStamp: () => {},
    takeHeapSnapshot: () => {},
    createInstance: () => globalWithConsole.console,
    exception: (...args: any[]) => {
      Zotero.logError(new Error(args.join(" ")));
    },
  };
}

// @ts-expect-error - Plugin instance is not typed
if (!basicTool.getGlobal("Zotero")[config.addonInstance]) {
  _globalThis.addon = new Addon();
  defineGlobal("ztoolkit", () => {
    return _globalThis.addon.data.ztoolkit;
  });
  // @ts-expect-error - Plugin instance is not typed
  Zotero[config.addonInstance] = addon;
  // @ts-expect-error - Backward compat for scaffold helpers/hooks
  Zotero.__addonInstance__ = addon;
}

function defineGlobal(name: Parameters<BasicTool["getGlobal"]>[0]): void;
function defineGlobal(name: string, getter: () => any): void;
function defineGlobal(name: string, getter?: () => any) {
  Object.defineProperty(_globalThis, name, {
    get() {
      return getter ? getter() : basicTool.getGlobal(name);
    },
  });
}
