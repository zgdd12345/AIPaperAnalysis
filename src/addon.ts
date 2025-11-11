import packageJson from "../package.json";
import { ColumnOptions, DialogHelper } from "zotero-plugin-toolkit";
import type { PromptManager } from "./modules/prompts/manager";
import hooks from "./hooks";
import { createZToolkit } from "./utils/ztoolkit";

const { config } = packageJson;

export interface PrefsState {
  window: Window;
  columns: Array<ColumnOptions>;
  rows: Array<{ [dataKey: string]: string }>;
  promptManager?: PromptManager;
  promptTable?: { render: () => void } | null;
  selectedPromptId?: string | null;
  editingPromptId?: string | null;
}

class Addon {
  public data: {
    alive: boolean;
    config: typeof config;
    // Env type, see build.js
    env: "development" | "production";
    initialized?: boolean;
    ztoolkit: ZToolkit;
    locale?: {
      current: any;
    };
    prefs?: PrefsState;
    dialog?: DialogHelper;
  };
  // Lifecycle hooks
  public hooks: typeof hooks;
  // APIs
  public api: object;

  constructor() {
    this.data = {
      alive: true,
      config,
      env: __env__,
      initialized: false,
      ztoolkit: createZToolkit(),
    };
    this.hooks = hooks;
    this.api = {};
  }
}

export default Addon;
