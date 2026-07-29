(function () {
  "use strict";

  const STORAGE_KEY = "mes-learning-progress-v1";

  function normalizeText(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function matchesCard(card, filters) {
    const query = normalizeText(filters?.query);
    const moduleName = normalizeText(filters?.module);
    const role = normalizeText(filters?.role);
    const modules = Array.isArray(card?.modules)
      ? card.modules.map(normalizeText)
      : [];
    const roles = Array.isArray(card?.roles)
      ? card.roles.map(normalizeText)
      : [];

    return (
      (!query || normalizeText(card?.text).includes(query)) &&
      (!moduleName || moduleName === "all" || modules.includes(moduleName)) &&
      (!role || role === "all" || roles.includes(role))
    );
  }

  function normalizeProgress(values) {
    if (!Array.isArray(values)) {
      return [];
    }

    return [...new Set(values
      .filter((value) => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean))]
      .sort();
  }

  function parseProgress(raw) {
    try {
      return normalizeProgress(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  function serializeProgress(values) {
    return JSON.stringify(normalizeProgress(values));
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      normalizeText,
      matchesCard,
      parseProgress,
      serializeProgress,
      initializeBrowser,
    };
    return;
  }

  if (typeof document === "undefined") {
    return;
  }

  function initializeBrowserUnsafe(documentRef, windowRef) {
    const cardElements = [...documentRef.querySelectorAll(".stage-card")];
    const cards = cardElements.map((element) => ({
      element,
      text: element.textContent,
      modules: (element.dataset.modules || "").split(/\s+/).filter(Boolean),
      roles: (element.dataset.roles || "").split(/\s+/).filter(Boolean),
    }));
    const searchInput = documentRef.querySelector("#stage-search");
    const moduleFilter = documentRef.querySelector("#module-filter");
    const roleFilter = documentRef.querySelector("#role-filter");
    const viewButtons = [
      ...documentRef.querySelectorAll(".view-button[data-view]"),
    ];
    const viewPanels = [
      ...documentRef.querySelectorAll("[data-view-panel]"),
    ];
    const viewHint = documentRef.querySelector(
      ".section-heading--stages > p",
    );
    const progressToggles = [
      ...documentRef.querySelectorAll(
        ".progress-toggle[data-stage-progress]",
      ),
    ];
    const progressValue = documentRef.querySelector(
      "#progress-summary .progress-summary__value",
    );
    const progressNext = documentRef.querySelector(
      "#progress-summary .progress-summary__next",
    );
    const progressComplete = documentRef.querySelector(
      "#progress-summary .progress-summary__complete",
    );

    function applyFilters() {
      const filters = {
        query: searchInput?.value || "",
        module: moduleFilter?.value || "all",
        role: roleFilter?.value || "all",
      };

      cards.forEach((card) => {
        card.element.classList.toggle(
          "is-filtered",
          !matchesCard(card, filters),
        );
      });
    }

    searchInput?.addEventListener("input", applyFilters);
    searchInput?.addEventListener("search", applyFilters);
    moduleFilter?.addEventListener("change", applyFilters);
    roleFilter?.addEventListener("change", applyFilters);
    applyFilters();

    const viewHints = {
      process: "流程视角：按八阶段顺序学习，沿数字线程理解上下游交接。",
      module: "模块视角：按工单、工艺、物料、设备、质量、追溯与报表索引定位知识。",
      role: "岗位视角：按角色索引定位职责、交接和 Java 开发关注点。",
    };

    function applyView(requestedView) {
      const selectedView = viewHints[requestedView] ? requestedView : "process";

      viewButtons.forEach((candidate) => {
        const isSelected = candidate.dataset.view === selectedView;
        candidate.setAttribute("aria-pressed", String(isSelected));
        candidate.classList.toggle("is-active", isSelected);
      });

      viewPanels.forEach((panel) => {
        panel.hidden = panel.dataset.viewPanel !== selectedView;
      });

      if (viewHint) {
        viewHint.textContent = viewHints[selectedView];
      }
      documentRef.documentElement.dataset.learningView = selectedView;
    }

    viewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyView(button.dataset.view);
      });
    });
    const initialView = viewButtons.find(
      (button) => button.getAttribute("aria-pressed") === "true",
    )?.dataset.view;
    applyView(initialView || "process");

    function readProgress() {
      try {
        return parseProgress(windowRef.localStorage.getItem(STORAGE_KEY));
      } catch {
        return [];
      }
    }

    function writeProgress(values) {
      try {
        windowRef.localStorage.setItem(STORAGE_KEY, serializeProgress(values));
      } catch {
        // Progress remains usable for this page view when storage is unavailable.
      }
    }

    function updateProgress() {
      let completedCount = 0;

      progressToggles.forEach((toggle) => {
        const isComplete = toggle.checked;
        const card = toggle.closest(".stage-card");
        const label = toggle.parentElement?.querySelector("span");

        completedCount += Number(isComplete);
        card?.classList.toggle("is-complete", isComplete);
        if (label) {
          label.textContent = isComplete ? "已学完" : "标记学完";
        }
      });

      if (progressValue) {
        progressValue.textContent = `${completedCount} / ${cards.length}`;
      }

      const nextToggle = progressToggles.find((toggle) => !toggle.checked);
      if (nextToggle) {
        const nextCard = nextToggle.closest(".stage-card");
        const nextStage = nextCard?.dataset.stage
          || nextToggle.dataset.stageProgress;
        const nextName = nextCard?.dataset.stageName || nextStage;

        if (progressNext) {
          progressNext.textContent = `下一阶段：${nextName}`;
          progressNext.setAttribute("href", `#stage-${nextStage}`);
          progressNext.hidden = false;
        }
        if (progressComplete) {
          progressComplete.hidden = true;
        }
      } else {
        if (progressNext) {
          progressNext.hidden = true;
        }
        if (progressComplete) {
          progressComplete.hidden = false;
        }
      }
    }

    const savedProgress = new Set(readProgress());
    progressToggles.forEach((toggle) => {
      toggle.checked = savedProgress.has(toggle.dataset.stageProgress);
      toggle.addEventListener("change", () => {
        updateProgress();
        writeProgress(
          progressToggles
            .filter((candidate) => candidate.checked)
            .map((candidate) => candidate.dataset.stageProgress),
        );
      });
    });
    updateProgress();

    const details = [
      ...documentRef.querySelectorAll(".stage-card details"),
    ];
    const stageHeading = documentRef.querySelector(
      ".section-heading--stages",
    );

    if (details.length && stageHeading && documentRef.createElement) {
      const actions = documentRef.createElement("div");
      const expandButton = documentRef.createElement("button");
      const collapseButton = documentRef.createElement("button");

      actions.className = "detail-actions";
      expandButton.type = "button";
      expandButton.textContent = "展开全部";
      collapseButton.type = "button";
      collapseButton.textContent = "收起全部";
      expandButton.addEventListener("click", () => {
        details.forEach((detail) => {
          detail.open = true;
        });
      });
      collapseButton.addEventListener("click", () => {
        details.forEach((detail) => {
          detail.open = false;
        });
      });
      actions.append(expandButton, collapseButton);
      stageHeading.append(actions);
    }
  }

  function initializeBrowser(documentRef, windowRef) {
    try {
      initializeBrowserUnsafe(documentRef, windowRef);
    } catch {
      documentRef
        .querySelectorAll(".stage-card.is-filtered")
        .forEach((card) => {
          card.classList.remove("is-filtered");
        });
      documentRef.querySelectorAll("[data-view-panel]").forEach((panel) => {
        panel.hidden = false;
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => initializeBrowser(document, window),
      { once: true },
    );
  } else {
    initializeBrowser(document, window);
  }
}());
