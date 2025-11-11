import { FluentMessageId } from "../../typings/i10n";
export { initLocale, getString, getLocaleID };
/**
 * Initialize locale data
 */
declare function initLocale(): void;
/**
 * Get locale string, see https://firefox-source-docs.mozilla.org/l10n/fluent/tutorial.html#fluent-translation-list-ftl
 * @param localString ftl key
 * @param options.branch branch name
 * @param options.args args
 * @example
 * ```ftl
 * # addon.ftl
 * addon-static-example = This is default branch!
 *     .branch-example = This is a branch under addon-static-example!
 * addon-dynamic-example =
    { $count ->
        [one] I have { $count } apple
       *[other] I have { $count } apples
    }
 * ```
 * ```js
 * getString("addon-static-example"); // This is default branch!
 * getString("addon-static-example", { branch: "branch-example" }); // This is a branch under addon-static-example!
 * getString("addon-dynamic-example", { args: { count: 1 } }); // I have 1 apple
 * getString("addon-dynamic-example", { args: { count: 2 } }); // I have 2 apples
 * ```
 */
declare function getString(localString: FluentMessageId): string;
declare function getString(
  localString: FluentMessageId,
  branch: string,
): string;
declare function getString(
  localeString: FluentMessageId,
  options: {
    branch?: string | undefined;
    args?: Record<string, unknown>;
  },
): string;
declare function getLocaleID(id: FluentMessageId): string;
