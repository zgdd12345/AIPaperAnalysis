import { getString } from "../utils/locale";
import { LLMManager } from "./llm/manager";
import { PromptManager } from "./prompts/manager";
import type { ProviderType } from "../types/llm";
import type { Prompt } from "../types/analysis";
import type { PrefsState } from "../addon";

const PREF_PREFIX = "extensions.aipaperanalysis.";
const DEFAULT_TEMPERATURE = 70;
const DEFAULT_MAX_TOKENS = 4000;
const PROVIDERS: ProviderType[] = [
  "openai",
  "anthropic",
  "deepseek",
  "aliyun",
  "bytedance",
  "custom",
];

export async function registerPrefsScripts(window: Window) {
  ensurePrefsState(window);

  initProviderSection(window);
  initAnalysisSection(window);
  // initVisualizationSection(window); // 可视化功能已禁用
  initPromptTable(window);
  bindGlobalEvents(window);
}

export async function testConnection(window: Window) {
  const { select, apiKeyInput, baseInput, modelInput } =
    getProviderElements(window);

  const provider = (select?.value ||
    getPref<ProviderType>(`${PREF_PREFIX}provider`, "openai")) as ProviderType;
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
  } catch (error: any) {
    showError(
      window,
      getString("prefs-test-error", { args: { error: formatError(error) } }),
    );
  }
}

function initProviderSection(window: Window) {
  const { select, apiKeyInput, baseInput, modelInput } =
    getProviderElements(window);

  if (!select || !apiKeyInput || !modelInput || !baseInput) {
    return;
  }

  const providerSelect = select;
  const apiKeyField = apiKeyInput;
  const baseField = baseInput;
  const modelField = modelInput;

  const currentProvider = getPref<ProviderType>(
    `${PREF_PREFIX}provider`,
    "openai",
  );
  providerSelect.value = currentProvider;
  loadProviderFields(currentProvider);

  providerSelect.addEventListener("command", () => {
    const provider = providerSelect.value as ProviderType;
    setPref(`${PREF_PREFIX}provider`, provider);
    loadProviderFields(provider);
  });

  apiKeyField.addEventListener("input", () => {
    const provider = providerSelect.value as ProviderType;
    setPref(getProviderPref(provider, "apiKey"), apiKeyField.value.trim());
  });
  baseField.addEventListener("input", () => {
    const provider = providerSelect.value as ProviderType;
    setPref(getProviderPref(provider, "baseURL"), baseField.value.trim());
  });
  modelField.addEventListener("input", () => {
    const provider = providerSelect.value as ProviderType;
    setPref(getProviderPref(provider, "model"), modelField.value.trim());
  });

  function loadProviderFields(provider: ProviderType) {
    const apiKey = getPref<string>(getProviderPref(provider, "apiKey"), "");
    const baseURL = getPref<string>(getProviderPref(provider, "baseURL"), "");
    const model = getPref<string>(
      getProviderPref(provider, "model"),
      provider === "openai" ? "gpt-4" : "",
    );

    apiKeyField.value = apiKey;
    baseField.value = baseURL;
    modelField.value = model;
  }
}

function initAnalysisSection(window: Window) {
  bindCheckbox(window, "aipaperanalysis-auto-note", "autoCreateNote");
  bindCheckbox(window, "aipaperanalysis-show-progress", "showDetailedProgress");

  const scale = window.document.getElementById(
    "aipaperanalysis-temperature",
  ) as HTMLInputElement | null;
  const label = window.document.getElementById(
    "aipaperanalysis-temperature-value",
  );
  if (scale && label) {
    const value = getPref<number>(
      `${PREF_PREFIX}temperature`,
      DEFAULT_TEMPERATURE,
    );
    scale.value = String(value);
    label.textContent = formatTemperature(value);
    scale.addEventListener("input", () => {
      const numeric = Number(scale.value) || 0;
      label.textContent = formatTemperature(numeric);
      setPref(`${PREF_PREFIX}temperature`, numeric);
    });
  }

  const maxTokens = window.document.getElementById(
    "aipaperanalysis-max-tokens",
  ) as HTMLInputElement | null;
  if (maxTokens) {
    const value = getPref<number>(
      `${PREF_PREFIX}maxTokens`,
      DEFAULT_MAX_TOKENS,
    );
    maxTokens.value = String(value);
    maxTokens.addEventListener("change", () => {
      const numeric = Number(maxTokens.value) || DEFAULT_MAX_TOKENS;
      maxTokens.value = String(numeric);
      setPref(`${PREF_PREFIX}maxTokens`, numeric);
    });
  }
}

// 可视化设置已禁用 - 功能需要修复后重新启用
// function initVisualizationSection(window: Window) {
//   bindCheckbox(window, "aipaperanalysis-chart-timeline", "charts.timeline");
//   bindCheckbox(window, "aipaperanalysis-chart-topic", "charts.topic");
//   bindCheckbox(window, "aipaperanalysis-chart-method", "charts.method");
//   bindCheckbox(window, "aipaperanalysis-chart-citation", "charts.citation");
//   bindCheckbox(window, "aipaperanalysis-chart-keyword", "charts.keyword");
// }

function initPromptTable(window: Window) {
  const prefs = ensurePrefsState(window);
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
    .setProp("getRowData", (index: number) => {
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
      prefs.selectedPromptId =
        selectedIndex >= 0 ? prompts[selectedIndex].id : null;
      updatePromptButtons(window);
    })
    .render();

  prefs.promptTable = table;
  updatePromptButtons(window);
}

function bindCheckbox(window: Window, elementId: string, prefKey: string) {
  const checkbox = window.document.getElementById(
    elementId,
  ) as XUL.Checkbox | null;
  if (!checkbox) return;

  const key = `${PREF_PREFIX}${prefKey}`;
  checkbox.checked = getPref<boolean>(key, true);
  checkbox.addEventListener("command", () => {
    setPref(key, checkbox.checked);
  });
}

function getProviderPref(provider: ProviderType, field: string): string {
  return `${PREF_PREFIX}${provider}.${field}`;
}

function getPref<T>(key: string, fallback: T): T {
  const value = Zotero.Prefs.get(key);
  return value === undefined || value === null ? fallback : (value as T);
}

function setPref(key: string, value: string | number | boolean): void {
  Zotero.Prefs.set(key, value);
}

function formatTemperature(value: number): string {
  return (value / 100).toFixed(2);
}

function getProviderElements(window: Window) {
  return {
    select: window.document.getElementById(
      "aipaperanalysis-provider",
    ) as XUL.MenuList | null,
    apiKeyInput: window.document.getElementById(
      "aipaperanalysis-api-key",
    ) as HTMLInputElement | null,
    baseInput: window.document.getElementById(
      "aipaperanalysis-base-url",
    ) as HTMLInputElement | null,
    modelInput: window.document.getElementById(
      "aipaperanalysis-model",
    ) as HTMLInputElement | null,
  };
}

function ensurePrefsState(window: Window): PrefsState {
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window,
      columns: [],
      rows: [],
    };
  } else {
    addon.data.prefs.window = window;
    addon.data.prefs.columns = addon.data.prefs.columns || [];
    addon.data.prefs.rows = addon.data.prefs.rows || [];
  }
  return addon.data.prefs;
}

function bindGlobalEvents(window: Window) {
  const mapping: Array<{ type: string; handler: () => void }> = [
    {
      type: "aipaperanalysis-test-connection",
      handler: () => {
        testConnection(window);
      },
    },
    {
      type: "aipaperanalysis-reset-prompts",
      handler: () => {
        resetPrompts(window);
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
    {
      type: "aipaperanalysis-save-prompt",
      handler: () => saveInlinePrompt(window),
    },
    {
      type: "aipaperanalysis-cancel-edit",
      handler: () => hideInlineEditor(window),
    },
  ];
  mapping.forEach(({ type, handler }) => {
    window.addEventListener(type, handler);
  });
}

function getPromptManager(window: Window): PromptManager {
  const prefs = ensurePrefsState(window);
  if (!prefs.promptManager) {
    prefs.promptManager = new PromptManager();
  }
  return prefs.promptManager;
}

function refreshPromptTable(window: Window) {
  addon.data.prefs?.promptTable?.render();
}

async function resetPrompts(window: Window) {
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

function showInfo(window: Window, message: string) {
  Zotero.alert(window, "AI Paper Analysis", message);
}

function showError(window: Window, message: string) {
  Zotero.alert(window, "AI Paper Analysis", message);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function getSelectedPrompt(window: Window) {
  const promptId = addon.data.prefs?.selectedPromptId as string | undefined;
  if (!promptId) return null;
  const prompts = getPromptManager(window).getAllPrompts();
  return prompts.find((p) => p.id === promptId) || null;
}

function updatePromptButtons(window: Window) {
  const editBtn = window.document.getElementById(
    "aipaperanalysis-prompts-edit",
  ) as HTMLButtonElement | null;
  const deleteBtn = window.document.getElementById(
    "aipaperanalysis-prompts-delete",
  ) as HTMLButtonElement | null;

  if (!editBtn || !deleteBtn) {
    return;
  }

  const prompt = getSelectedPrompt(window);
  editBtn.disabled = !prompt;
  deleteBtn.disabled = !prompt || prompt.isDefault;
}

function openPromptEditorDialog(window: Window, prompt?: Prompt) {
  const params: {
    prompt?: Prompt;
    result?: {
      name: string;
      category?: string;
      description?: string;
      content: string;
    };
  } = { prompt };
  const modeless = Zotero.Prefs.get(
    "extensions.aipaperanalysis.debug.modelessDialogs",
  ) as boolean;
  const flags = modeless ? "chrome,centerscreen,resizable" : "chrome,modal,centerscreen";
  window.openDialog(
    "chrome://aipaperanalysis/content/prompt-editor.xhtml",
    "prompt-editor",
    flags,
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

function addPrompt(window: Window) {
  // Show inline editor with empty fields for new prompt
  showInlineEditor(window, null);
}

function editPrompt(window: Window) {
  const prompt = getSelectedPrompt(window);
  if (!prompt) {
    showError(window, getString("prefs-edit-prompt-error"));
    return;
  }

  // Show inline editor with prompt data
  showInlineEditor(window, prompt);
}

function deletePrompt(window: Window) {
  const prompt = getSelectedPrompt(window);
  if (!prompt) {
    showError(window, getString("prefs-delete-prompt-error"));
    return;
  }

  // Show special confirmation for default prompts
  const confirmMessage = prompt.isDefault
    ? "Are you sure you want to delete this default prompt? You can restore it using the Reset button."
    : getString("prefs-delete-prompt-confirm");

  if (!window.confirm(confirmMessage)) {
    return;
  }

  getPromptManager(window)
    .deletePrompt(prompt.id)
    .then(() => {
      refreshPromptTable(window);
      hideInlineEditor(window); // Hide editor if currently editing deleted prompt
    })
    .catch((error) =>
      showError(
        window,
        getString("prefs-delete-prompt-failed", {
          args: { error: formatError(error) },
        }),
      ),
    );
}

// ==================== Inline Editor Functions ====================

function getInlineEditorElements(window: Window) {
  return {
    panel: window.document.getElementById("aipaperanalysis-prompt-edit-panel") as XUL.Element | null,
    nameInput: window.document.getElementById("aipaperanalysis-prompt-edit-name") as HTMLInputElement | null,
    categoryInput: window.document.getElementById("aipaperanalysis-prompt-edit-category") as HTMLInputElement | null,
    descriptionInput: window.document.getElementById("aipaperanalysis-prompt-edit-description") as HTMLInputElement | null,
    contentInput: window.document.getElementById("aipaperanalysis-prompt-edit-content") as HTMLTextAreaElement | null,
    deleteButton: window.document.getElementById("aipaperanalysis-prompt-delete-inline") as HTMLButtonElement | null,
  };
}

function showInlineEditor(window: Window, prompt: Prompt | null) {
  const elements = getInlineEditorElements(window);
  if (!elements.panel || !elements.nameInput || !elements.categoryInput || !elements.descriptionInput || !elements.contentInput || !elements.deleteButton) {
    return;
  }

  // Store current editing prompt ID
  const prefs = ensurePrefsState(window);
  prefs.editingPromptId = prompt?.id || null;

  // Fill form fields
  elements.nameInput.value = prompt?.name || "";
  elements.categoryInput.value = prompt?.category || "";
  elements.descriptionInput.value = prompt?.description || "";
  elements.contentInput.value = prompt?.content || "";

  // Show/hide delete button based on whether editing existing prompt
  if (prompt) {
    elements.deleteButton.hidden = false;
  } else {
    elements.deleteButton.hidden = true;
  }

  // Show the panel
  elements.panel.hidden = false;

  // Focus on name input
  elements.nameInput.focus();
}

function hideInlineEditor(window: Window) {
  const elements = getInlineEditorElements(window);
  if (!elements.panel) {
    return;
  }

  // Clear form
  if (elements.nameInput) elements.nameInput.value = "";
  if (elements.categoryInput) elements.categoryInput.value = "";
  if (elements.descriptionInput) elements.descriptionInput.value = "";
  if (elements.contentInput) elements.contentInput.value = "";

  // Clear editing state
  const prefs = ensurePrefsState(window);
  prefs.editingPromptId = null;

  // Hide panel
  elements.panel.hidden = true;
}

function saveInlinePrompt(window: Window) {
  const elements = getInlineEditorElements(window);
  if (!elements.nameInput || !elements.categoryInput || !elements.descriptionInput || !elements.contentInput) {
    return;
  }

  const name = elements.nameInput.value.trim();
  const category = elements.categoryInput.value.trim();
  const description = elements.descriptionInput.value.trim();
  const content = elements.contentInput.value.trim();

  // Validate required fields
  if (!name || !content) {
    showError(window, "Name and content are required.");
    return;
  }

  const prefs = ensurePrefsState(window);
  const editingId = prefs.editingPromptId;

  if (editingId) {
    // Update existing prompt
    getPromptManager(window)
      .updatePrompt(editingId, { name, category, description, content })
      .then(() => {
        refreshPromptTable(window);
        hideInlineEditor(window);
        showInfo(window, "Prompt updated successfully.");
      })
      .catch((error) =>
        showError(
          window,
          getString("prefs-edit-prompt-failed", {
            args: { error: formatError(error) },
          }),
        ),
      );
  } else {
    // Add new prompt
    getPromptManager(window)
      .addPrompt(name, content, { category, description })
      .then(() => {
        refreshPromptTable(window);
        hideInlineEditor(window);
        showInfo(window, "Prompt added successfully.");
      })
      .catch((error) =>
        showError(
          window,
          getString("prefs-add-prompt-error", {
            args: { error: formatError(error) },
          }),
        ),
      );
  }
}
