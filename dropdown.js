export class DropdownMenu {
  constructor(
    element = null,
    onSelectFunction = () =>
      console.log("This dropdown menu has no function on select")
  ) {
    if (element) {
      this.element = element;
      this.button = element.querySelector(".ddn-btn");
      this.menu = element.querySelector(".ddn-menu");
      this.items = [];
      this.menu.querySelectorAll(".ddn-item").forEach((e) => {
        this.items.push(new DropdownItem(e, this));
      });
      this.selected = this.items.length > 0 ? this.items[0] : null;
    } else {
      this.element = document.createElement("div");
      this.element.className = "ddn";
      this.element.innerText = itemText;
      this.button = document.createElement("button");
      this.button.className = "ddn-btn";
      this.button.innerHTML = `
          <div class="ddn-icon">
            <i class="icon-up hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="1.38em" height="1em" viewBox="0 0 22 16">
                <path fill="currentColor" d="M0 3h14v3H0zm0 4h14v3H0zm0 4h14v3H0zm15.5-1l3-3l3 3z" />
              </svg>
            </i>
            <i class="icon-down">
              <svg xmlns="http://www.w3.org/2000/svg" width="1.38em" height="1em" viewBox="0 0 22 16">
                <path fill="currentColor" d="M0 3h14v3H0zm0 4h14v3H0zm0 4h14v3H0zm15.5-4l3 3l3-3z" />
              </svg>
            </i>
          </div>
      `;
      this.menu = document.createElement("div");
      this.menu.className = "ddn-menu hidden";
      this.items = [];
      this.selected = null;
    }
    if (this.selected)
      this.button.querySelector(".ddn-selected").innerText = this.selected.name;
    this.button.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    document.documentElement.addEventListener("click", () => {
      if (!this.menu.classList.contains("hidden")) this.toggle();
    });
    this.onSelect = onSelectFunction;
  }

  toggle() {
    let iconUp = this.element.querySelector(".icon-up");
    let iconDown = this.element.querySelector(".icon-down");
    if (this.menu.classList.contains("hidden")) {
      iconDown.classList.add("hidden");
      iconUp.classList.remove("hidden");
      this.menu.classList.remove("hidden");
    } else {
      iconDown.classList.remove("hidden");
      iconUp.classList.add("hidden");
      this.menu.classList.add("hidden");
    }
  }

  addItem(item = new DropdownItem(null, this), selectIfNoneSelected = false) {
    item.dropdownMenu = this;
    this.items.push(item);
    this.menu.append(item.element);
    if (
      selectIfNoneSelected &&
      (this.selected === null || !this.items.includes(this.selected))
    )
      this.selectItem(item);
  }

  removeItem(itemName) {
    let item = this.items.find((i) => i.name === itemName);
    if (item === null) return;
    item.element.remove();
    this.items.splice(this.items.indexOf(item), 1);
    if (this.selected === item) this.selected = null;
  }

  selectItem(item) {
    if (this.selected) {
      if (this.selected === item) return;
      this.selected.element.classList.remove("selected");
      this.selected = item;
      item.element.classList.add("selected");
      this.button.querySelector(".ddn-selected").innerText = this.selected.name;
      this.onSelect();
    } else {
      this.selected = item;
      item.element.classList.add("selected");
      this.button.querySelector(".ddn-selected").innerText = this.selected.name;
      this.onSelect();
    }
  }

  clear() {
    this.items.forEach((item) => {
      item.element.remove();
    });
    this.items = [];
  }
}

export class DropdownItem {
  constructor(element = null, dropdownMenu = null, name = null) {
    if (element) {
      this.element = element;
      this.name = element.innerText;
      this.dropdownMenu = dropdownMenu
        ? dropdownMenu
        : new DropdownMenu(element.parentElement);
    } else {
      this.element = document.createElement("div");
      this.element.className = "ddn-item";
      if (name) {
        this.name = name;
        this.element.innerText = name;
      } else {
        this.name = "New Item";
        this.element.innerText = "New Item";
      }
      this.dropdownMenu = dropdownMenu ? dropdownMenu : null;
    }
    this.element.addEventListener("click", () => {
      this.select();
    });
  }

  add = () => (this.dropdownMenu ? this.dropdownMenu.addItem(this) : null);

  remove = () =>
    this.dropdownMenu ? this.dropdownMenu.removeItem(this.name) : null;

  select = () =>
    this.dropdownMenu ? this.dropdownMenu.selectItem(this) : null;
}
