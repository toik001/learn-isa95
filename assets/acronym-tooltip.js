(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
    return;
  }

  root.AcronymTooltip = api;

  const initialize = () => api.initializeAcronymTooltips(document, root);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})(typeof window === "undefined" ? globalThis : window, function () {
  function parseAcronymDefinition(value) {
    const [english = "", ...chineseParts] = String(value ?? "").split("｜");
    return {
      english: english.trim(),
      chinese: chineseParts.join("｜").trim(),
    };
  }

  function calculateTooltipPosition(
    anchorRect,
    tooltipRect,
    viewport,
    gap = 8,
    padding = 8,
  ) {
    const centeredLeft = (
      anchorRect.left + anchorRect.right - tooltipRect.width
    ) / 2;
    const maxLeft = Math.max(padding, viewport.width - tooltipRect.width - padding);
    const left = Math.min(Math.max(centeredLeft, padding), maxLeft);
    const below = anchorRect.bottom + gap;
    const fitsBelow = below + tooltipRect.height <= viewport.height - padding;
    const above = anchorRect.top - tooltipRect.height - gap;
    return {
      left: Math.round(left),
      top: Math.round(fitsBelow ? below : Math.max(padding, above)),
    };
  }

  function initializeAcronymTooltips(documentRef, windowRef) {
    const abbreviations = documentRef.querySelectorAll("abbr[title]");
    if (abbreviations.length === 0) {
      return null;
    }

    const tooltip = documentRef.createElement("div");
    const englishElement = documentRef.createElement("span");
    const chineseElement = documentRef.createElement("span");
    tooltip.classList.add("acronym-tooltip");
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
    englishElement.classList.add("acronym-tooltip__english");
    chineseElement.classList.add("acronym-tooltip__chinese");
    tooltip.append(englishElement, chineseElement);
    documentRef.body.append(tooltip);

    let activeAbbreviation = null;
    const hide = () => {
      tooltip.hidden = true;
      tooltip.classList.remove("is-visible");
      activeAbbreviation = null;
    };
    const show = (abbr) => {
      const { english, chinese } = parseAcronymDefinition(
        abbr.dataset.acronymDefinition,
      );
      englishElement.textContent = english;
      chineseElement.textContent = chinese;
      tooltip.hidden = false;
      tooltip.classList.add("is-visible");
      const position = calculateTooltipPosition(
        abbr.getBoundingClientRect(),
        tooltip.getBoundingClientRect(),
        { width: windowRef.innerWidth, height: windowRef.innerHeight },
      );
      tooltip.style.left = `${position.left}px`;
      tooltip.style.top = `${position.top}px`;
      activeAbbreviation = abbr;
    };
    const getEnhancedAbbreviation = (target) => (
      target && typeof target.closest === "function"
        ? target.closest("abbr[data-acronym-definition]")
        : null
    );
    const onPointerOver = (event) => {
      const abbr = getEnhancedAbbreviation(event.target);
      if (abbr) show(abbr);
    };
    const onPointerOut = (event) => {
      if (
        activeAbbreviation
        && activeAbbreviation.contains(event.target)
        && !activeAbbreviation.contains(event.relatedTarget)
      ) {
        hide();
      }
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") hide();
    };

    const originalAttributes = new Map();
    try {
      abbreviations.forEach((abbr) => {
        const definition = abbr.getAttribute("title");
        const { english, chinese } = parseAcronymDefinition(definition);
        const term = abbr.textContent.trim();
        originalAttributes.set(abbr, {
          title: definition,
          ariaLabel: abbr.getAttribute("aria-label"),
          acronymDefinition: abbr.getAttribute("data-acronym-definition"),
        });
        abbr.dataset.acronymDefinition = definition;
        abbr.setAttribute(
          "aria-label",
          `${term}：${english}${chinese ? `，${chinese}` : ""}`,
        );
        abbr.removeAttribute("title");
      });

      documentRef.addEventListener("pointerover", onPointerOver);
      documentRef.addEventListener("pointerout", onPointerOut);
      documentRef.addEventListener("keydown", onKeydown);
      windowRef.addEventListener("scroll", hide);
      windowRef.addEventListener("resize", hide);
    } catch (error) {
      documentRef.removeEventListener("pointerover", onPointerOver);
      documentRef.removeEventListener("pointerout", onPointerOut);
      documentRef.removeEventListener("keydown", onKeydown);
      windowRef.removeEventListener("scroll", hide);
      windowRef.removeEventListener("resize", hide);
      originalAttributes.forEach((attributes, abbr) => {
        abbr.setAttribute("title", attributes.title);
        if (attributes.ariaLabel === null) {
          abbr.removeAttribute("aria-label");
        } else {
          abbr.setAttribute("aria-label", attributes.ariaLabel);
        }
        if (attributes.acronymDefinition === null) {
          delete abbr.dataset.acronymDefinition;
        } else {
          abbr.dataset.acronymDefinition = attributes.acronymDefinition;
        }
      });
      tooltip.remove();
      throw error;
    }

    return { hide, tooltip };
  }

  return {
    parseAcronymDefinition,
    calculateTooltipPosition,
    initializeAcronymTooltips,
  };
});
