(() => {
  "use strict";

  const ICONS = {
    army: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill-icon" d="M12 5.25l2.05 4.15 4.58.67-3.31 3.23.78 4.56L12 15.7l-4.1 2.16.78-4.56-3.31-3.23 4.58-.67L12 5.25Z"></path></svg>',
    navy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10.4"></path><path d="M8.3 7.5h7.4"></path><path d="M9.2 14.4a2.8 2.8 0 0 0 5.6 0"></path><path d="M5.8 14c.52 3.72 2.9 6.15 6.2 6.15S17.68 17.72 18.2 14"></path><path d="M12 20.15V14.4"></path></svg>',
    marine: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.65 18.3 7.25v5.05c0 3.85-2.45 6.32-6.3 7.55-3.85-1.23-6.3-3.7-6.3-7.55V7.25L12 4.65Z"></path><path d="M8.6 11.35h6.8"></path><path d="M9.8 14.15h4.4"></path></svg>',
    airforce: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5v10.1"></path><path d="M12 10.6 5.5 14.15c-.8.44-.66 1.62.22 1.88l2.78.8L12 14.9l3.5 1.93 2.78-.8c.88-.26 1.02-1.44.22-1.88L12 10.6Z"></path><path d="m9.4 18.75 2.6-1.28 2.6 1.28"></path></svg>',
    qna: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.1a8.1 8.1 0 1 0-7.02-4.05L4 19.2l3.24-.86A8.08 8.08 0 0 0 12 20.1Z"></path><path d="M9.65 9.55a2.4 2.4 0 0 1 4.7.78c0 1.72-1.75 2.1-2.24 3.16"></path><path d="M12 16.28h.02"></path></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.4-4.4"></path><circle cx="11" cy="11" r="6.2"></circle></svg>',
  };

  const PAGE_SIZE_FALLBACK = 8;
  const CHECKLIST_SELECTOR = "[data-checklist]";

  const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const text = (value, limit = 80) => String(value || "").trim().slice(0, limit);
  const slugify = (value) =>
    text(value, 64)
      .toLocaleLowerCase("ko-KR")
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "");

  function renderIcons() {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      const svg = ICONS[node.dataset.icon];
      if (svg) node.innerHTML = svg;
    });
  }

  async function fetchJson(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${path} 파일을 불러오지 못했습니다.`);
    return response.json();
  }

  function readObject(key) {
    try {
      const value = localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : {};
      return isPlainObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장이 차단된 환경에서도 화면 조작은 계속 가능해야 합니다.
    }
  }

  function create(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = content;
    return element;
  }

  function makeId(prefix) {
    const time = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 7);
    return `${prefix}-custom-${time}-${random}`;
  }

  function normalizeCustomItems(custom, categoryIds) {
    const normalized = {};
    categoryIds.forEach((categoryId) => {
      const items = Array.isArray(custom[categoryId]) ? custom[categoryId] : [];
      normalized[categoryId] = items
        .filter((item) => item && typeof item.id === "string")
        .map((item) => ({ id: item.id, text: text(item.text, 32) }))
        .filter((item) => item.text);
    });
    return normalized;
  }

  function buildCheckItem(item, checked, isCustom = false) {
    const id = text(item.id, 96);
    const li = create("li", `check-item${isCustom ? " custom-item" : ""}`);
    li.dataset.id = id;
    if (isCustom) li.dataset.custom = "true";

    const row = create("div", "check-row");
    const input = create("input", "item-check");
    input.type = "checkbox";
    input.id = id;
    input.dataset.id = id;
    input.checked = Boolean(checked[id]);

    const fake = create("label", "fake-check");
    fake.htmlFor = id;
    fake.setAttribute("aria-hidden", "true");

    const copy = create("label", "item-copy");
    copy.htmlFor = id;
    const title = create("strong", "item-title", isCustom ? item.text : item.title);
    const description = create("em", "", isCustom ? "직접 추가한 항목" : item.description);
    copy.append(title, description);

    row.append(input, fake, copy);
    if (isCustom) {
      const actions = create("span", "custom-actions");
      actions.setAttribute("aria-label", "직접 추가 항목 관리");
      const edit = create("button", "", "수정");
      const remove = create("button", "", "삭제");
      edit.type = "button";
      remove.type = "button";
      edit.dataset.action = "edit-custom";
      remove.dataset.action = "delete-custom";
      actions.append(edit, remove);
      row.append(actions);
    }
    li.append(row);
    return li;
  }

  function buildCategory(branch, category, checked, customItems) {
    const categoryId = text(category.id, 40);
    const article = create("article", "category");
    article.dataset.category = categoryId;

    const head = create("div", "category-head");
    const copy = create("div");
    copy.append(create("h3", "", category.title), create("p", "", category.description));

    const addButton = create("button", "add-button");
    addButton.type = "button";
    addButton.dataset.action = "toggle-add";
    addButton.setAttribute("aria-label", `${category.title}에 항목 추가`);
    addButton.append(create("span", "add-plus"));
    addButton.firstElementChild?.setAttribute("aria-hidden", "true");
    head.append(copy, addButton);

    const form = create("form", "add-form");
    form.dataset.addForm = "";
    form.hidden = true;
    const inputId = `add-${branch}-${categoryId}`;
    const label = create("label", "sr-only", `${category.title} 준비물 추가`);
    label.htmlFor = inputId;
    const input = create("input");
    input.id = inputId;
    input.name = "item";
    input.type = "text";
    input.maxLength = 32;
    input.autocomplete = "off";
    input.placeholder = "준비물 이름";
    const submit = create("button", "", "추가");
    submit.type = "submit";
    form.append(label, input, submit);

    const list = create("ul", "item-list");
    const baseItems = Array.isArray(category.items) ? category.items : [];
    baseItems
      .map((item, index) => ({
        id: text(item?.id, 96) || `${branch}-${categoryId}-${slugify(item?.title) || `item-${index + 1}`}`,
        title: text(item?.title, 80),
        description: text(item?.description, 160),
      }))
      .filter((item) => item.title)
      .forEach((item) => list.append(buildCheckItem(item, checked)));
    customItems.forEach((item) => list.append(buildCheckItem(item, checked, true)));

    article.append(head, form, list);
    return article;
  }

  function updateProgress(root, checked) {
    const inputs = [...root.querySelectorAll(".item-check")];
    const total = inputs.length;
    const done = inputs.filter((input) => input.checked).length;
    const left = Math.max(total - done, 0);
    const percent = total ? Math.round((done / total) * 100) : 0;

    document.getElementById("progressText").textContent = `${percent}%`;
    document.getElementById("countText").textContent = `${done} / ${total} 완료`;
    document.getElementById("leftText").textContent = left === 0 ? "모두 완료" : `${left}개 남음`;
    document.getElementById("progressFill").style.width = `${percent}%`;

    const validIds = new Set(inputs.map((input) => input.dataset.id));
    Object.keys(checked).forEach((id) => {
      if (!validIds.has(id)) delete checked[id];
    });
  }

  async function initChecklist() {
    const root = document.querySelector(CHECKLIST_SELECTOR);
    const branch = document.body.dataset.branch;
    const list = document.getElementById("categoryList");
    if (!root || !branch || !list) return;

    const storage = {
      checked: `gwanmuldae.v2.${branch}.checked`,
      custom: `gwanmuldae.v2.${branch}.custom`,
    };
    const checked = readObject(storage.checked);
    let custom = readObject(storage.custom);

    try {
      const data = await fetchJson(`data/${branch}.json`);
      const categories = Array.isArray(data.categories) ? data.categories : [];
      const categoryIds = categories.map((category) => text(category.id, 40)).filter(Boolean);
      custom = normalizeCustomItems(custom, categoryIds);
      list.replaceChildren();
      categories.forEach((category) => {
        const id = text(category.id, 40);
        list.append(buildCategory(branch, category, checked, custom[id] || []));
      });
      writeObject(storage.custom, custom);
      updateProgress(root, checked);
      writeObject(storage.checked, checked);
    } catch {
      list.replaceChildren(create("div", "error-card", "준비물 데이터를 불러오지 못했습니다. 로컬 서버 또는 배포 환경에서 data 폴더가 함께 있는지 확인하세요."));
      return;
    }

    function saveChecked() { writeObject(storage.checked, checked); }
    function saveCustom() { writeObject(storage.custom, custom); }

    root.addEventListener("change", (event) => {
      const input = event.target.closest(".item-check");
      if (!input || !root.contains(input)) return;
      if (input.checked) checked[input.dataset.id] = true;
      else delete checked[input.dataset.id];
      saveChecked();
      updateProgress(root, checked);
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button || !root.contains(button)) return;

      const action = button.dataset.action;
      const category = button.closest(".category");
      const itemNode = button.closest(".custom-item");
      const categoryId = category?.dataset.category;

      if (action === "toggle-add") {
        const form = category?.querySelector("[data-add-form]");
        if (!form) return;
        form.hidden = !form.hidden;
        if (!form.hidden) form.querySelector("input")?.focus();
      }

      if (action === "delete-custom" && categoryId && itemNode) {
        const id = itemNode.dataset.id;
        custom[categoryId] = (custom[categoryId] || []).filter((item) => item.id !== id);
        delete checked[id];
        saveCustom();
        saveChecked();
        itemNode.remove();
        updateProgress(root, checked);
      }

      if (action === "edit-custom" && itemNode && !itemNode.querySelector(".edit-form")) {
        const currentText = text(itemNode.querySelector(".item-title")?.textContent, 32);
        const form = create("form", "edit-form");
        const input = create("input");
        input.name = "edit";
        input.type = "text";
        input.maxLength = 32;
        input.autocomplete = "off";
        input.setAttribute("aria-label", "준비물 이름 수정");
        input.value = currentText;
        const save = create("button", "", "저장");
        const cancel = create("button", "", "취소");
        save.type = "submit";
        cancel.type = "button";
        cancel.dataset.action = "cancel-edit";
        form.append(input, save, cancel);
        itemNode.append(form);
        input.focus();
      }

      if (action === "cancel-edit") button.closest(".edit-form")?.remove();
    });

    root.addEventListener("submit", (event) => {
      const addForm = event.target.closest("[data-add-form]");
      const editForm = event.target.closest(".edit-form");
      if (!addForm && !editForm) return;
      event.preventDefault();

      if (addForm) {
        const category = addForm.closest(".category");
        const categoryId = category?.dataset.category;
        const input = addForm.querySelector('input[name="item"]');
        const value = text(input?.value, 32);
        if (!categoryId || !value) return;
        custom[categoryId] = [...(custom[categoryId] || []), { id: makeId(`${branch}-${categoryId}`), text: value }];
        input.value = "";
        addForm.hidden = true;
        saveCustom();
        const item = custom[categoryId][custom[categoryId].length - 1];
        category.querySelector(".item-list")?.append(buildCheckItem(item, checked, true));
        updateProgress(root, checked);
      }

      if (editForm) {
        const itemNode = editForm.closest(".custom-item");
        const categoryId = editForm.closest(".category")?.dataset.category;
        const id = itemNode?.dataset.id;
        const value = text(editForm.querySelector('input[name="edit"]')?.value, 32);
        if (!categoryId || !id || !value) return;
        const item = (custom[categoryId] || []).find((entry) => entry.id === id);
        if (item) item.text = value;
        saveCustom();
        itemNode.querySelector(".item-title").textContent = value;
        editForm.remove();
      }
    });
  }

  async function initQna() {
    const root = document.getElementById("qnaResults");
    const input = document.getElementById("qnaSearch");
    const clear = document.getElementById("qnaClear");
    const status = document.getElementById("qnaStatus");
    const pagination = document.getElementById("qnaPagination");
    if (!root || !input || !clear || !status || !pagination) return;

    let items = [];
    let pageSize = PAGE_SIZE_FALLBACK;
    let page = 1;

    try {
      const data = await fetchJson("data/qna.json");
      items = Array.isArray(data.items) ? data.items : [];
      pageSize = Number.isInteger(data.pageSize) && data.pageSize > 0 ? data.pageSize : PAGE_SIZE_FALLBACK;
    } catch {
      root.replaceChildren(create("div", "error-card", "Q&A 데이터를 불러오지 못했습니다. data/qna.json 파일을 확인하세요."));
      return;
    }

    const getResults = () => {
      const query = input.value.trim().toLocaleLowerCase("ko-KR");
      if (query.length < 2) return items;
      return items.filter((item) => `${item.question} ${item.answer}`.toLocaleLowerCase("ko-KR").includes(query));
    };

    function render() {
      const query = input.value.trim();
      const results = getResults();
      const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
      page = Math.min(page, totalPages);
      const start = (page - 1) * pageSize;
      const current = results.slice(start, start + pageSize);

      clear.hidden = query.length === 0;
      if (query.length === 1) status.textContent = "두 글자 이상 입력하면 검색됩니다.";
      else if (query.length >= 2) status.textContent = results.length ? `검색 결과 ${results.length}개` : "검색 결과가 없습니다.";
      else status.textContent = `총 ${items.length}개 질문`;

      root.replaceChildren();
      if (!current.length) {
        root.append(create("div", "empty-card", "일치하는 질문이 없습니다. 검색어를 바꿔 다시 시도해보세요."));
      } else {
        current.forEach((item) => {
          const card = create("article", "qna-card");
          card.append(create("h2", "", item.question), create("p", "", item.answer));
          root.append(card);
        });
      }

      pagination.replaceChildren();
      if (results.length <= pageSize) return;

      const prev = create("button", "page-button", "‹");
      prev.type = "button";
      prev.disabled = page === 1;
      prev.setAttribute("aria-label", "이전 페이지");
      prev.addEventListener("click", () => { page -= 1; render(); });
      pagination.append(prev);

      for (let index = 1; index <= totalPages; index += 1) {
        const button = create("button", `page-button${index === page ? " is-current" : ""}`, String(index));
        button.type = "button";
        button.setAttribute("aria-label", `${index}페이지`);
        if (index === page) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => { page = index; render(); });
        pagination.append(button);
      }

      const next = create("button", "page-button", "›");
      next.type = "button";
      next.disabled = page === totalPages;
      next.setAttribute("aria-label", "다음 페이지");
      next.addEventListener("click", () => { page += 1; render(); });
      pagination.append(next);
    }

    input.addEventListener("input", () => { page = 1; render(); });
    clear.addEventListener("click", () => { input.value = ""; input.focus(); page = 1; render(); });
    render();
  }

  renderIcons();
  initChecklist();
  initQna();
})();
