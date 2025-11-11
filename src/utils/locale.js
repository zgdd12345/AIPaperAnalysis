import { config } from "../../package.json";
export { initLocale, getString, getLocaleID };
/**
 * Initialize locale data
 */
function initLocale() {
  const l10n = new (
    typeof Localization === "undefined"
      ? ztoolkit.getGlobal("Localization")
      : Localization
  )([`${config.addonRef}-addon.ftl`], true);
  addon.data.locale = {
    current: l10n,
  };
}
function getString(...inputs) {
  if (inputs.length === 1) {
    return _getString(inputs[0]);
  } else if (inputs.length === 2) {
    if (typeof inputs[1] === "string") {
      return _getString(inputs[0], { branch: inputs[1] });
    } else {
      return _getString(inputs[0], inputs[1]);
    }
  } else {
    throw new Error("Invalid arguments");
  }
}
function _getString(localeString, options = {}) {
  const localStringWithPrefix = `${config.addonRef}-${localeString}`;
  const { branch, args } = options;
  const pattern = addon.data.locale?.current.formatMessagesSync([
    { id: localStringWithPrefix, args },
  ])[0];
  if (!pattern) {
    return localStringWithPrefix;
  }
  if (branch && pattern.attributes) {
    for (const attr of pattern.attributes) {
      if (attr.name === branch) {
        return attr.value;
      }
    }
    return pattern.attributes[branch] || localStringWithPrefix;
  } else {
    return pattern.value || localStringWithPrefix;
  }
}
function getLocaleID(id) {
  return `${config.addonRef}-${id}`;
}
