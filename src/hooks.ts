import { getString, initLocale } from "./utils/locale";
import {
  registerPrefsScripts,
  testConnection as testPrefsConnection,
} from "./modules/preferenceScript";
import { createZToolkit } from "./utils/ztoolkit";
import {
  cleanupPlugin,
  getPluginInstance,
  initializePlugin,
} from "./modules/plugin";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  // 记录环境诊断信息
  logEnvironmentDiagnostics();

  initLocale();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  await initializePlugin();

  // Mark initialized as true to confirm plugin loading status
  // outside of the plugin (e.g. scaffold testing process)
  addon.data.initialized = true;
}

/**
 * 记录环境诊断信息，帮助排查兼容性问题
 */
function logEnvironmentDiagnostics(): void {
  try {
    const diagnostics = {
      zoteroVersion: Zotero.version,
      platform: Zotero.platform,
      hasAbortController:
        typeof (globalThis as any).AbortController !== "undefined",
      hasAbortSignal: typeof (globalThis as any).AbortSignal !== "undefined",
      hasFetch: typeof (globalThis as any).fetch !== "undefined",
      hasEventTarget: typeof EventTarget !== "undefined",
    };

    Zotero.debug(
      `[AIPaperAnalysis] Environment diagnostics: ${JSON.stringify(diagnostics, null, 2)}`,
    );

    // 如果缺少关键 API，记录警告
    if (!diagnostics.hasAbortController) {
      Zotero.debug(
        "[AIPaperAnalysis] WARNING: AbortController not available, polyfill should have been applied",
      );
    }

    if (!diagnostics.hasEventTarget) {
      Zotero.logError(
        new Error(
          "[AIPaperAnalysis] CRITICAL: EventTarget not available, polyfills may fail",
        ),
      );
    }
  } catch (error) {
    Zotero.logError(
      new Error(
        `[AIPaperAnalysis] Failed to collect environment diagnostics: ${error}`,
      ),
    );
  }
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  // Create ztoolkit for every window
  addon.data.ztoolkit = createZToolkit();

  win.MozXULElement.insertFTLIfNeeded(
    `${addon.data.config.addonRef}-mainWindow.ftl`,
  );

  const popupWin = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
    closeOnClick: true,
    closeTime: -1,
  })
    .createLine({
      text: getString("startup-begin"),
      type: "default",
      progress: 0,
    })
    .show();

  await Zotero.Promise.delay(1000);
  popupWin.changeLine({
    progress: 30,
    text: `[30%] ${getString("startup-begin")}`,
  });

  popupWin.changeLine({
    progress: 100,
    text: `[100%] ${getString("startup-finish")}`,
  });
  popupWin.startCloseTimer(5000);
}

async function onMainWindowUnload(_win: Window): Promise<void> {
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
}

function onShutdown(): void {
  cleanupPlugin();
  ztoolkit.unregisterAll();
  addon.data.dialog?.window?.close();
  // Remove addon object
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  ztoolkit.log("notify", event, type, ids, extraData);
  const plugin = getPluginInstance();
  if (!plugin.isInitialized()) {
    return;
  }
}

/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      registerPrefsScripts(data.window);
      break;
    case "testConnection":
      await testPrefsConnection(data.window);
      break;
    default:
      return;
  }
}

function onShortcuts(type: string) {
  switch (type) {
    case "larger":
      break;
    case "smaller":
      break;
    default:
      break;
  }
}

function onDialogEvents(type: string) {
  switch (type) {
    default:
      break;
  }
}

// Add your hooks here. For element click, etc.
// Keep in mind hooks only do dispatch. Don't add code that does real jobs in hooks.
// Otherwise the code would be hard to read and maintain.

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
