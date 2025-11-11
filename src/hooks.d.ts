declare function onStartup(): Promise<void>;
declare function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void>;
declare function onMainWindowUnload(_win: Window): Promise<void>;
declare function onShutdown(): void;
/**
 * This function is just an example of dispatcher for Notify events.
 * Any operations should be placed in a function to keep this funcion clear.
 */
declare function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: {
    [key: string]: any;
  },
): Promise<void>;
/**
 * This function is just an example of dispatcher for Preference UI events.
 * Any operations should be placed in a function to keep this funcion clear.
 * @param type event type
 * @param data event data
 */
declare function onPrefsEvent(
  type: string,
  data: {
    [key: string]: any;
  },
): Promise<void>;
declare function onShortcuts(type: string): void;
declare function onDialogEvents(type: string): void;
declare const _default: {
  onStartup: typeof onStartup;
  onShutdown: typeof onShutdown;
  onMainWindowLoad: typeof onMainWindowLoad;
  onMainWindowUnload: typeof onMainWindowUnload;
  onNotify: typeof onNotify;
  onPrefsEvent: typeof onPrefsEvent;
  onShortcuts: typeof onShortcuts;
  onDialogEvents: typeof onDialogEvents;
};
export default _default;
