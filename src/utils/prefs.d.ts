type PluginPrefsMap = _ZoteroTypes.Prefs["PluginPrefsMap"];
/**
 * Get preference value.
 * Wrapper of `Zotero.Prefs.get`.
 * @param key
 */
export declare function getPref<K extends keyof PluginPrefsMap>(key: K): PluginPrefsMap[K];
/**
 * Set preference value.
 * Wrapper of `Zotero.Prefs.set`.
 * @param key
 * @param value
 */
export declare function setPref<K extends keyof PluginPrefsMap>(key: K, value: PluginPrefsMap[K]): any;
/**
 * Clear preference value.
 * Wrapper of `Zotero.Prefs.clear`.
 * @param key
 */
export declare function clearPref(key: string): any;
export {};
