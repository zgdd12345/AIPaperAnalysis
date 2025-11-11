import { getString } from "../utils/locale";
import { LLMManager } from "./llm/manager";
import { PromptManager } from "./prompts/manager";
const PREF_PREFIX = "extensions.aipaperanalysis.";
const DEFAULT_TEMPERATURE = 70;
const DEFAULT_MAX_TOKENS = 4000;
const PROVIDERS = [
  "openai",
  "anthropic",
  "deepseek",
  "aliyun",
  "bytedance",
  "custom",
];
export async function registerPrefsScripts(window) {
  addon.data.prefs = addon.data.prefs || { window };
  addon.data.prefs.window = window;
  initProviderSection(window);
  initAnalysisSection(window);
  initVisualizationSection(window);
  initPromptTable(window);
  bindGlobalEvents(window);
}
export async function testConnection(window) {
  const { select, apiKeyInput, baseInput, modelInput } =
    getProviderElements(window);
  const provider = select?.value || getPref(`${PREF_PREFIX}provider`, "openai");
  const apiKey = apiKeyInput?.value.trim();
  if (!apiKey) {
    showError(
      window,
      getString("prefs-test-error", { args: { error: "Missing API key" } }),
    );
    return;
  }
  try {
    const manager = new LLMManager();
    manager.addProvider({
      type: provider,
      apiKey,
      baseURL: baseInput?.value.trim() || undefined,
      defaultModel: modelInput?.value.trim() || undefined,
    });
    manager.setActiveProvider(provider);
    const result = await manager.testConnection(provider);
    const message = result.success
      ? getString("prefs-test-success", { args: { message: result.message } })
      : getString("prefs-test-error", { args: { error: result.message } });
    showInfo(window, message);
  } catch (error) {
    showError(
      window,
      getString("prefs-test-error", { args: { error: formatError(error) } }),
    );
  }
}
export function openPromptManager(window) {
  window.openDialog(
    "chrome://aipaperanalysis/content/prompt-manager.xhtml",
    "prompt-manager",
    "chrome,centerscreen,modal,width=800,height=600",
  );
}
function initProviderSection(window) {
  const { select, apiKeyInput, baseInput, modelInput } =
    getProviderElements(window);
  if (!select || !apiKeyInput || !modelInput || !baseInput) {
    return;
  }
  const currentProvider = getPref(`${PREF_PREFIX}provider`, "openai");
  select.value = currentProvider;
  loadProviderFields(currentProvider);
  select.addEventListener("command", () => {
    const provider = select.value;
    setPref(`${PREF_PREFIX}provider`, provider);
    loadProviderFields(provider);
  });
  apiKeyInput.addEventListener("input", () => {
    const provider = select.value;
    setPref(getProviderPref(provider, "apiKey"), apiKeyInput.value.trim());
  });
  baseInput.addEventListener("input", () => {
    const provider = select.value;
    setPref(getProviderPref(provider, "baseURL"), baseInput.value.trim());
  });
  modelInput.addEventListener("input", () => {
    const provider = select.value;
    setPref(getProviderPref(provider, "model"), modelInput.value.trim());
  });
  function loadProviderFields(provider) {
    const apiKey = getPref(getProviderPref(provider, "apiKey"), "");
    const baseURL = getPref(getProviderPref(provider, "baseURL"), "");
    const model = getPref(
      getProviderPref(provider, "model"),
      provider === "openai" ? "gpt-4" : "",
    );
    apiKeyInput.value = apiKey;
    baseInput.value = baseURL;
    modelInput.value = model;
  }
}
function initAnalysisSection(window) {
  bindCheckbox(window, "aipaperanalysis-auto-note", "autoCreateNote");
  bindCheckbox(window, "aipaperanalysis-show-progress", "showDetailedProgress");
  const scale = window.document.getElementById("aipaperanalysis-temperature");
  const label = window.document.getElementById(
    "aipaperanalysis-temperature-value",
  );
  if (scale && label) {
    const value = getPref(`${PREF_PREFIX}temperature`, DEFAULT_TEMPERATURE);
    scale.value = value;
    label.textContent = formatTemperature(value);
    scale.addEventListener("input", () => {
      label.textContent = formatTemperature(Number(scale.value));
      setPref(`${PREF_PREFIX}temperature`, Number(scale.value));
    });
  }
  const maxTokens = window.document.getElementById(
    "aipaperanalysis-max-tokens",
  );
  if (maxTokens) {
    const value = getPref(`${PREF_PREFIX}maxTokens`, DEFAULT_MAX_TOKENS);
    maxTokens.value = String(value);
    maxTokens.addEventListener("change", () => {
      const numeric = Number(maxTokens.value) || DEFAULT_MAX_TOKENS;
      maxTokens.value = String(numeric);
      setPref(`${PREF_PREFIX}maxTokens`, numeric);
    });
  }
}
function initVisualizationSection(window) {
  bindCheckbox(window, "aipaperanalysis-chart-timeline", "charts.timeline");
  bindCheckbox(window, "aipaperanalysis-chart-topic", "charts.topic");
  bindCheckbox(window, "aipaperanalysis-chart-method", "charts.method");
  bindCheckbox(window, "aipaperanalysis-chart-citation", "charts.citation");
  bindCheckbox(window, "aipaperanalysis-chart-keyword", "charts.keyword");
}
function initPromptTable(window) {
  const container = window.document.getElementById(
    "aipaperanalysis-prompts-table",
  );
  if (!container) return;
  const table = new ztoolkit.VirtualizedTable(window)
    .setContainerId("aipaperanalysis-prompts-table")
    .setProp({
      id: "aipaperanalysis-prompts-list",
      columns: [
        { dataKey: "name", label: "Name", width: 160 },
        { dataKey: "category", label: "Category", width: 120 },
        { dataKey: "description", label: "Description", flex: 1 },
      ],
      showHeader: true,
      multiSelect: false,
      disableFontSizeScaling: true,
    })
    .setProp(
      "getRowCount",
      () => getPromptManager(window).getAllPrompts().length,
    )
    .setProp("getRowData", (index) => {
      const prompts = getPromptManager(window).getAllPrompts();
      const prompt = prompts[index];
      return {
        name: prompt.name,
        category: prompt.category || "-",
        description: prompt.description || "",
      };
    })
    .setProp("onSelectionChange", (selection) => {
      const prompts = getPromptManager(window).getAllPrompts();
      let selectedIndex = -1;
      for (let i = 0; i < prompts.length; i++) {
        if (selection.isSelected(i)) {
          selectedIndex = i;
          break;
        }
      }
      addon.data.prefs.selectedPromptId =
        selectedIndex >= 0 ? prompts[selectedIndex].id : null;
      updatePromptButtons(window);
    })
    .render();
  addon.data.prefs.promptTable = table;
  updatePromptButtons(window);
}
function bindCheckbox(window, elementId, prefKey) {
  const checkbox = window.document.getElementById(elementId);
  if (!checkbox) return;
  const key = `${PREF_PREFIX}${prefKey}`;
  checkbox.checked = getPref(key, true);
  checkbox.addEventListener("command", () => {
    setPref(key, checkbox.checked);
  });
}
function getProviderPref(provider, field) {
  return `${PREF_PREFIX}${provider}.${field}`;
}
function getPref(key, fallback) {
  const value = Zotero.Prefs.get(key);
  return value === undefined || value === null ? fallback : value;
}
function setPref(key, value) {
  Zotero.Prefs.set(key, value);
}
function formatTemperature(value) {
  return (value / 100).toFixed(2);
}
function getProviderElements(window) {
  return {
    select: window.document.getElementById("aipaperanalysis-provider"),
    apiKeyInput: window.document.getElementById("aipaperanalysis-api-key"),
    baseInput: window.document.getElementById("aipaperanalysis-base-url"),
    modelInput: window.document.getElementById("aipaperanalysis-model"),
  };
}
function bindGlobalEvents(window) {
  const mapping = [
    {
      type: "aipaperanalysis-test-connection",
      handler: () => {
        testConnection(window);
      },
    },
    {
      type: "aipaperanalysis-open-prompt-manager",
      handler: () => {
        openPromptManager(window);
      },
    },
    {
      type: "aipaperanalysis-reset-prompts",
      handler: () => {
        resetPrompts(window);
      },
    },
    {
      type: "aipaperanalysis-export-prompts",
      handler: () => {
        exportPrompts(window);
      },
    },
    {
      type: "aipaperanalysis-import-prompts",
      handler: () => {
        importPrompts(window);
      },
    },
    {
      type: "aipaperanalysis-add-prompt",
      handler: () => addPrompt(window),
    },
    {
      type: "aipaperanalysis-edit-prompt",
      handler: () => editPrompt(window),
    },
    {
      type: "aipaperanalysis-delete-prompt",
      handler: () => deletePrompt(window),
    },
  ];
  mapping.forEach(({ type, handler }) => {
    window.addEventListener(type, handler);
  });
}
function getPromptManager(window) {
  addon.data.prefs = addon.data.prefs || { window };
  if (!addon.data.prefs.promptManager) {
    addon.data.prefs.promptManager = new PromptManager();
  }
  return addon.data.prefs.promptManager;
}
function refreshPromptTable(window) {
  addon.data.prefs?.promptTable?.render();
}
async function resetPrompts(window) {
  try {
    await getPromptManager(window).resetToDefaults();
    refreshPromptTable(window);
    showInfo(window, getString("prefs-reset-success"));
  } catch (error) {
    showError(
      window,
      getString("prefs-reset-error", { args: { error: formatError(error) } }),
    );
  }
}
async function exportPrompts(window) {
  try {
    const filePath = await Zotero.FilePicker.saveFile(
      getString("prefs-export-prompts"),
      "aipaperanalysis-prompts.json",
    );
    if (!filePath) {
      return;
    }
    const data = getPromptManager(window).exportPrompts();
    await Zotero.File.putContentsAsync(filePath, data);
    showInfo(
      window,
      getString("prefs-export-success", { args: { path: filePath } }),
    );
  } catch (error) {
    showError(
      window,
      getString("prefs-export-error", { args: { error: formatError(error) } }),
    );
  }
}
async function importPrompts(window) {
  try {
    const confirmed = window.confirm(getString("prefs-import-confirm"));
    if (!confirmed) {
      return;
    }
    const filePath = await Zotero.FilePicker.openFile(
      getString("prefs-import-prompts"),
    );
    if (!filePath) {
      showInfo(window, getString("prefs-import-cancel"));
      return;
    }
    const content = await Zotero.File.getContentsAsync(filePath);
    await getPromptManager(window).importPrompts(String(content), {
      replace: true,
    });
    refreshPromptTable(window);
    const count = getPromptManager(window).getAllPrompts().length;
    showInfo(window, getString("prefs-import-success", { args: { count } }));
  } catch (error) {
    showError(
      window,
      getString("prefs-import-error", { args: { error: formatError(error) } }),
    );
  }
}
function showInfo(window, message) {
  Zotero.alert(window, "AI Paper Analysis", message, null);
}
function showError(window, message) {
  Zotero.alert(window, "AI Paper Analysis", message, null);
}
function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
function getSelectedPrompt(window) {
  const promptId = addon.data.prefs?.selectedPromptId;
  if (!promptId) return null;
  const prompts = getPromptManager(window).getAllPrompts();
  return prompts.find((p) => p.id === promptId) || null;
}
function updatePromptButtons(window) {
  const editBtn = window.document.getElementById(
    "aipaperanalysis-prompts-edit",
  );
  const deleteBtn = window.document.getElementById(
    "aipaperanalysis-prompts-delete",
  );
  if (!editBtn || !deleteBtn) {
    return;
  }
  const prompt = getSelectedPrompt(window);
  editBtn.disabled = !prompt;
  deleteBtn.disabled = !prompt || prompt.isDefault;
}
function openPromptEditorDialog(window, prompt) {
  const params = { prompt };
  window.openDialog(
    "chrome://aipaperanalysis/content/prompt-editor.xhtml",
    "prompt-editor",
    "chrome,modal,centerscreen",
    params,
  );
  if (!params.result) {
    return null;
  }
  return {
    name: params.result.name.trim(),
    content: params.result.content.trim(),
    category: params.result.category?.trim() || undefined,
    description: params.result.description?.trim() || undefined,
  };
}
function addPrompt(window) {
  const result = openPromptEditorDialog(window);
  if (!result) return;
  getPromptManager(window)
    .addPrompt(result.name, result.content, {
      category: result.category,
      description: result.description,
    })
    .then(() => refreshPromptTable(window))
    .catch((error) =>
      showError(
        window,
        getString("prefs-add-prompt-error", {
          args: { error: formatError(error) },
        }),
      ),
    );
}
function editPrompt(window) {
  const prompt = getSelectedPrompt(window);
  if (!prompt) {
    showError(window, getString("prefs-edit-prompt-error"));
    return;
  }
  const result = openPromptEditorDialog(window, prompt);
  if (!result) return;
  getPromptManager(window)
    .updatePrompt(prompt.id, result)
    .then(() => refreshPromptTable(window))
    .catch((error) =>
      showError(
        window,
        getString("prefs-edit-prompt-failed", {
          args: { error: formatError(error) },
        }),
      ),
    );
}
function deletePrompt(window) {
  const prompt = getSelectedPrompt(window);
  if (!prompt) {
    showError(window, getString("prefs-delete-prompt-error"));
    return;
  }
  if (!window.confirm(getString("prefs-delete-prompt-confirm"))) {
    return;
  }
  getPromptManager(window)
    .deletePrompt(prompt.id)
    .then(() => refreshPromptTable(window))
    .catch((error) =>
      showError(
        window,
        getString("prefs-delete-prompt-failed", {
          args: { error: formatError(error) },
        }),
      ),
    );
}
