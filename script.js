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
  const text = (value, limit = 80) => String(value || "").trim().slice(0, limit);
  const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

  function create(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function readObject(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "{}");
      return isObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 저장이 차단된 환경에서도 체크리스트 조작은 계속 가능해야 합니다.
    }
  }

  function makeId(prefix) {
    return `${prefix}-custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function renderIcons() {
    document.querySelectorAll("[data-icon]").forEach((node) => {
      const icon = ICONS[node.dataset.icon];
      if (icon) node.innerHTML = icon;
    });
  }

  function customItemNode(item, checked) {
    const id = text(item.id, 96);
    const li = create("li", "check-item custom-item");
    li.dataset.id = id;
    li.dataset.custom = "true";

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
    copy.append(create("strong", "item-title", item.text), create("em", "", "직접 추가한 항목"));

    const actions = create("span", "custom-actions");
    actions.setAttribute("aria-label", "직접 추가 항목 관리");
    const edit = create("button", "", "수정");
    const remove = create("button", "", "삭제");
    edit.type = "button";
    remove.type = "button";
    edit.dataset.action = "edit-custom";
    remove.dataset.action = "delete-custom";
    actions.append(edit, remove);

    row.append(input, fake, copy, actions);
    li.append(row);
    return li;
  }

  function updateProgress(root, checked) {
    const inputs = [...root.querySelectorAll(".item-check")];
    const total = inputs.length;
    const done = inputs.filter((input) => input.checked).length;
    const percent = total ? Math.round((done / total) * 100) : 0;
    const left = Math.max(total - done, 0);

    const progressText = document.getElementById("progressText");
    const countText = document.getElementById("countText");
    const leftText = document.getElementById("leftText");
    const progressFill = document.getElementById("progressFill");

    if (progressText) progressText.textContent = `${percent}%`;
    if (countText) countText.textContent = `${done} / ${total} 완료`;
    if (leftText) leftText.textContent = left === 0 ? "모두 완료" : `${left}개 남음`;
    if (progressFill) progressFill.style.width = `${percent}%`;

    const validIds = new Set(inputs.map((input) => input.dataset.id));
    Object.keys(checked).forEach((id) => {
      if (!validIds.has(id)) delete checked[id];
    });
  }

  function normalizeCustom(custom, categoryIds) {
    const next = {};
    categoryIds.forEach((id) => {
      next[id] = (Array.isArray(custom[id]) ? custom[id] : [])
        .filter((item) => item && typeof item.id === "string")
        .map((item) => ({ id: item.id, text: text(item.text, 32) }))
        .filter((item) => item.text);
    });
    return next;
  }

  function initChecklist() {
    const root = document.querySelector("[data-checklist]");
    const branch = document.body.dataset.branch;
    if (!root || !branch) return;

    const checkedKey = `gwanmuldae.v2.${branch}.checked`;
    const customKey = `gwanmuldae.v2.${branch}.custom`;
    const checked = readObject(checkedKey);
    const categories = [...root.querySelectorAll(".category")];
    const categoryIds = categories.map((category) => category.dataset.category).filter(Boolean);
    let custom = normalizeCustom(readObject(customKey), categoryIds);

    root.querySelectorAll(".item-check").forEach((input) => {
      input.checked = Boolean(checked[input.dataset.id]);
    });

    categories.forEach((category) => {
      const list = category.querySelector(".item-list");
      const categoryId = category.dataset.category;
      (custom[categoryId] || []).forEach((item) => list?.append(customItemNode(item, checked)));
    });

    updateProgress(root, checked);
    writeObject(checkedKey, checked);
    writeObject(customKey, custom);

    root.addEventListener("change", (event) => {
      const input = event.target.closest(".item-check");
      if (!input || !root.contains(input)) return;
      if (input.checked) checked[input.dataset.id] = true;
      else delete checked[input.dataset.id];
      writeObject(checkedKey, checked);
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
        return;
      }

      if (action === "delete-custom" && categoryId && itemNode) {
        const id = itemNode.dataset.id;
        custom[categoryId] = (custom[categoryId] || []).filter((item) => item.id !== id);
        delete checked[id];
        itemNode.remove();
        writeObject(customKey, custom);
        writeObject(checkedKey, checked);
        updateProgress(root, checked);
        return;
      }

      if (action === "edit-custom" && itemNode && !itemNode.querySelector(".edit-form")) {
        const form = create("form", "edit-form");
        const input = create("input");
        input.name = "edit";
        input.type = "text";
        input.maxLength = 32;
        input.autocomplete = "off";
        input.setAttribute("aria-label", "준비물 이름 수정");
        input.value = text(itemNode.querySelector(".item-title")?.textContent, 32);
        const save = create("button", "", "저장");
        const cancel = create("button", "", "취소");
        save.type = "submit";
        cancel.type = "button";
        cancel.dataset.action = "cancel-edit";
        form.append(input, save, cancel);
        itemNode.append(form);
        input.focus();
        return;
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
        const value = text(addForm.querySelector('input[name="item"]')?.value, 32);
        if (!categoryId || !value) return;
        const item = { id: makeId(`${branch}-${categoryId}`), text: value };
        custom[categoryId] = [...(custom[categoryId] || []), item];
        addForm.querySelector("input").value = "";
        addForm.hidden = true;
        category.querySelector(".item-list")?.append(customItemNode(item, checked));
        writeObject(customKey, custom);
        updateProgress(root, checked);
        return;
      }

      const itemNode = editForm.closest(".custom-item");
      const categoryId = editForm.closest(".category")?.dataset.category;
      const id = itemNode?.dataset.id;
      const value = text(editForm.querySelector('input[name="edit"]')?.value, 32);
      if (!categoryId || !id || !value) return;
      const item = (custom[categoryId] || []).find((entry) => entry.id === id);
      if (item) item.text = value;
      itemNode.querySelector(".item-title").textContent = value;
      editForm.remove();
      writeObject(customKey, custom);
    });
  }

  function readQnaData() {
    const node = document.getElementById("qnaData");
    if (!node) return null;
    try {
      const parsed = JSON.parse(node.textContent || "{}");
      return isObject(parsed) && Array.isArray(parsed.items) ? parsed : null;
    } catch {
      return null;
    }
  }

  function qnaCard(item) {
    const card = create("article", "qna-card");
    card.dataset.qnaId = text(item.id, 40);
    card.append(create("h2", "", item.question), create("p", "", item.answer));
    return card;
  }

  function initQna() {
    const root = document.getElementById("qnaResults");
    const input = document.getElementById("qnaSearch");
    const clear = document.getElementById("qnaClear");
    const status = document.getElementById("qnaStatus");
    const pagination = document.getElementById("qnaPagination");
    const data = readQnaData();
    if (!root || !input || !clear || !status || !pagination || !data) return;

    const items = data.items;
    const pageSize = Number.isInteger(data.pageSize) && data.pageSize > 0 ? data.pageSize : PAGE_SIZE_FALLBACK;
    let page = Number(document.body.dataset.qnaPage || 1) || 1;

    const matches = () => {
      const query = input.value.trim().toLocaleLowerCase("ko-KR");
      if (query.length < 2) return items;
      return items.filter((item) => {
        const keywords = Array.isArray(item.keywords) ? item.keywords.join(" ") : "";
        return `${item.question} ${item.answer} ${keywords}`.toLocaleLowerCase("ko-KR").includes(query);
      });
    };

    function render() {
      const query = input.value.trim();
      const results = matches();
      const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
      page = Math.min(Math.max(page, 1), totalPages);
      const visible = results.slice((page - 1) * pageSize, page * pageSize);

      clear.hidden = query.length === 0;
      if (query.length === 1) status.textContent = "두 글자 이상 입력하면 검색됩니다.";
      else if (query.length >= 2) status.textContent = results.length ? `검색 결과 ${results.length}개` : "검색 결과가 없습니다.";
      else status.textContent = `총 ${items.length}개 질문`;

      root.replaceChildren(...(visible.length ? visible.map(qnaCard) : [create("div", "empty-card", "일치하는 질문이 없습니다. 검색어를 바꿔 다시 시도해보세요.")]));

      pagination.replaceChildren();
      if (results.length <= pageSize) return;

      const makeButton = (label, nextPage, aria, disabled = false) => {
        const button = create("button", "page-button", label);
        button.type = "button";
        button.disabled = disabled;
        button.setAttribute("aria-label", aria);
        button.addEventListener("click", () => { page = nextPage; render(); });
        return button;
      };

      pagination.append(makeButton("‹", page - 1, "이전 페이지", page === 1));
      for (let index = 1; index <= totalPages; index += 1) {
        const button = makeButton(String(index), index, `${index}페이지`);
        if (index === page) {
          button.classList.add("is-current");
          button.setAttribute("aria-current", "page");
        }
        pagination.append(button);
      }
      pagination.append(makeButton("›", page + 1, "다음 페이지", page === totalPages));
    }

    input.addEventListener("input", () => { page = 1; render(); });
    clear.addEventListener("click", () => { input.value = ""; input.focus(); page = 1; render(); });
    render();
  }

  renderIcons();
  initChecklist();
  initQna();
})();
