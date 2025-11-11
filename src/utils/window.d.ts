export { isWindowAlive };
/**
 * Check if the window is alive.
 * Useful to prevent opening duplicate windows.
 * @param win
 */
declare function isWindowAlive(win?: Window): boolean | undefined;
