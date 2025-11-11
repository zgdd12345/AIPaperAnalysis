import { expect } from "chai";
import { PromptManager } from "../src/modules/prompts/manager";
import { LLMManager } from "../src/modules/llm/manager";
import { VisualizationTab } from "../src/modules/visualization/tab";
import type { AggregatedData } from "../src/modules/visualization/aggregator";

const prefStore = new Map<string, any>();

function setupZoteroStub() {
  const globalAny = globalThis as any;
  globalAny.Zotero = {
    Prefs: {
      get(key: string) {
        return prefStore.has(key) ? prefStore.get(key) : undefined;
      },
      set(key: string, value: any) {
        prefStore.set(key, value);
      },
      clear(key: string) {
        prefStore.delete(key);
      },
    },
  };

  globalAny.addon = {
    data: {
      config: {
        addonID: "ai-paper-analysis@test",
        addonRef: "aipaperanalysis",
      },
      locale: {
        current: {
          formatMessagesSync: () => [
            {
              value: "",
              attributes: [],
            },
          ],
        },
      },
    },
  };

  globalAny.ztoolkit = {
    getGlobal: () =>
      class {
        formatMessagesSync() {
          return [
            {
              value: "",
              attributes: [],
            },
          ];
        }
      },
  };
}

function resetPrefs() {
  prefStore.clear();
}

function getPrefValue(key: string) {
  return prefStore.get(key);
}

setupZoteroStub();

describe("Stage 6 regression tests", function () {
  beforeEach(function () {
    resetPrefs();
  });

  describe("PromptManager flows", function () {
    it("loads defaults on first run and persists them", function () {
      const manager = new PromptManager();
      const prompts = manager.getAllPrompts();
      expect(prompts.length).to.equal(6);
      const stored = getPrefValue("extensions.aipaperanalysis.prompts");
      expect(stored).to.be.a("string");
      const parsed = JSON.parse(stored);
      expect(parsed).to.have.length(6);
    });

    it("adds, updates, and deletes custom prompts", async function () {
      const manager = new PromptManager();
      const created = await manager.addPrompt("Test prompt", "content", {
        description: "desc",
        category: "custom",
      });

      expect(manager.getPromptById(created.id)).to.exist;

      await manager.updatePrompt(created.id, {
        name: "Updated prompt",
        description: "updated",
      });

      const updated = manager.getPromptById(created.id);
      expect(updated?.name).to.equal("Updated prompt");
      expect(updated?.description).to.equal("updated");

      await manager.deletePrompt(created.id);
      expect(manager.getPromptById(created.id)).to.be.undefined;
    });

    it("prevents editing protected fields on default prompts", async function () {
      const manager = new PromptManager();
      const defaultPrompt = manager.getAllPrompts().find((p) => p.isDefault);
      expect(defaultPrompt).to.exist;

      let error: any;
      try {
        await manager.updatePrompt(defaultPrompt!.id, { content: "hack" });
      } catch (err) {
        error = err;
      }

      expect(error?.message).to.include(
        "Cannot modify content of default prompts",
      );
    });

    it("rejects invalid import payloads", async function () {
      const manager = new PromptManager();
      let error: any;
      try {
        await manager.importPrompts('{"invalid":"payload"}');
      } catch (err) {
        error = err;
      }
      expect(error?.message).to.include("格式无效");
    });
  });

  describe("LLMManager preference sync", function () {
    it("stores provider configuration and active provider", function () {
      const manager = new LLMManager();
      manager.addProvider({
        type: "openai",
        apiKey: "sk-test",
        baseURL: "https://example.com/v1",
        defaultModel: "gpt-4o",
      });

      manager.setActiveProvider("openai");

      expect(manager.getActiveProvider()).to.equal("openai");
      expect(manager.getConfiguredProviders()).to.deep.equal(["openai"]);

      const config = manager.getProviderConfig("openai");
      expect(config?.baseURL).to.equal("https://example.com/v1");
      expect(getPrefValue("extensions.aipaperanalysis.provider")).to.equal(
        "openai",
      );
    });

    it("removes provider configuration cleanly", function () {
      const manager = new LLMManager();
      manager.addProvider({
        type: "openai",
        apiKey: "sk-test",
      });
      manager.setActiveProvider("openai");

      manager.removeProvider("openai");
      expect(manager.getConfiguredProviders()).to.be.empty;
      expect(manager.getActiveProvider()).to.be.null;
      expect(getPrefValue("extensions.aipaperanalysis.openai.apiKey")).to.be
        .undefined;
    });
  });

  describe("Visualization exports", function () {
    const baseData: AggregatedData = {
      timeline: [
        { year: "2023", count: 5, items: [1, 2, 3] },
        { year: "2022", count: 2, items: [4] },
      ],
      topics: [
        { topic: "AI", count: 3, items: [1, 2] },
        { topic: "NLP", count: 1, items: [3] },
      ],
      methods: [
        { method: "Survey", count: 2 },
        { method: "Experiment", count: 1 },
      ],
      keywords: [
        { word: "LLM", frequency: 4 },
        { word: "Reasoning", frequency: 2 },
      ],
      citations: {
        nodes: [
          { id: 1, title: "Paper A", year: "2023" },
          { id: 2, title: "Paper B", year: "2022" },
        ],
        links: [{ source: 1, target: 2, weight: 1 }],
      },
    };

    it("includes active filters in markdown export", function () {
      const tab = new VisualizationTab() as any;
      tab.activeYears.add("2023");
      tab.activeTopics.add("AI");

      const markdown = tab.buildMarkdownExport(baseData);
      expect(markdown).to.include("## Active Filters");
      expect(markdown).to.include("Years: 2023");
      expect(markdown).to.include("Topics: AI");
      expect(markdown).to.include("## Timeline");
      expect(markdown).to.include("- 2023: 5");
    });

    it("generates CSV rows for all sections", function () {
      const tab = new VisualizationTab() as any;
      const csv = tab.buildCSV(baseData);
      const lines = csv.split("\n");
      expect(lines).to.include('Timeline,"2023","5"');
      expect(lines).to.include('Topics,"AI","3"');
      expect(lines).to.include('Methods,"Survey","2"');
      expect(lines).to.include('Keywords,"LLM","4"');
      expect(lines.some((line: string) => line.startsWith("Citation Node"))).to
        .be.true;
      expect(lines.some((line: string) => line.startsWith("Citation Link"))).to
        .be.true;
    });

    it("handles large datasets within reasonable time", function () {
      const tab = new VisualizationTab() as any;
      const heavyData: AggregatedData = {
        timeline: Array.from({ length: 200 }, (_, index) => ({
          year: `${1800 + index}`,
          count: (index % 7) + 1,
          items: [index],
        })),
        topics: Array.from({ length: 200 }, (_, index) => ({
          topic: `Topic-${index}`,
          count: (index % 5) + 1,
          items: [index],
        })),
        methods: Array.from({ length: 50 }, (_, index) => ({
          method: `Method-${index}`,
          count: index + 1,
        })),
        keywords: Array.from({ length: 300 }, (_, index) => ({
          word: `Keyword-${index}`,
          frequency: (index % 10) + 1,
        })),
        citations: {
          nodes: Array.from({ length: 100 }, (_, index) => ({
            id: index,
            title: `Title ${index}`,
            year: `${1900 + (index % 100)}`,
          })),
          links: Array.from({ length: 200 }, (_, index) => ({
            source: index % 100,
            target: (index + 1) % 100,
            weight: (index % 3) + 1,
          })),
        },
      };

      const started = Date.now();
      const csv = tab.buildCSV(heavyData);
      const duration = Date.now() - started;
      expect(csv.length).to.be.greaterThan(1000);
      expect(duration).to.be.below(500);
    });
  });
});
