/* eslint-disable no-var */
var PromptEditor = {
  params: null,

  onLoad() {
    this.params = window.arguments?.[0] || {};
    const prompt = this.params.prompt || {};
    const nameInput = document.getElementById("prompt-editor-name-input");
    const categoryInput = document.getElementById(
      "prompt-editor-category-input",
    );
    const descriptionInput = document.getElementById(
      "prompt-editor-description-input",
    );
    const contentInput = document.getElementById("prompt-editor-content-input");

    if (!nameInput || !categoryInput || !descriptionInput || !contentInput) {
      console.error(
        "[AI Paper Analysis] Prompt editor dialog missing required fields",
      );
      return;
    }

    nameInput.value = prompt.name || "";
    categoryInput.value = prompt.category || "";
    descriptionInput.value = prompt.description || "";
    contentInput.value = prompt.content || "";
  },

  onAccept() {
    const name = document
      .getElementById("prompt-editor-name-input")
      .value.trim();
    const content = document
      .getElementById("prompt-editor-content-input")
      .value.trim();

    if (!name || !content) {
      const label = document.getElementById("prompt-editor-error-message");
      window.alert(label?.textContent || "Name and content are required.");
      return false;
    }

    this.params.result = {
      name,
      category: document
        .getElementById("prompt-editor-category-input")
        .value.trim(),
      description: document
        .getElementById("prompt-editor-description-input")
        .value.trim(),
      content,
    };
    return true;
  },
};

window.addEventListener("load", () => {
  try {
    PromptEditor.onLoad();
  } catch (error) {
    console.error("[AI Paper Analysis] Failed to initialize prompt editor", error);
  }
});
