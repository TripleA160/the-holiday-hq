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
      Array.from(element.children).forEach((child) => {
        this.items.push(new DropdownItem(null, this, child.innerText));
      });
      this.menu.querySelectorAll(".ddn-item").forEach((e) => {
        this.items.push(new DropdownItem(e, this));
      });
      this.selected = this.items.length > 0 ? this.items[0] : null;
    } else {
      this.element = document.createElement("div");
      this.element.className = "ddn";
      this.element.innerText = "New Dropdown Menu";
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
      this.button.querySelector(".ddn-selected").innerHTML =
        this.selected.element.innerHTML;
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
    iconDown.classList.toggle("hidden");
    iconUp.classList.toggle("hidden");
    this.menu.classList.toggle("hidden");
    if (this.selected && this.selected.element)
      this.selected.element.scrollIntoView({
        behavior: "instant",
        block: "center",
      });
  }
  close() {
    let iconUp = this.element.querySelector(".icon-up");
    let iconDown = this.element.querySelector(".icon-down");
    iconDown.classList.remove("hidden");
    iconUp.classList.add("hidden");
    this.menu.classList.add("hidden");
  }
  open() {
    let iconUp = this.element.querySelector(".icon-up");
    let iconDown = this.element.querySelector(".icon-down");
    iconDown.classList.add("hidden");
    iconUp.classList.remove("hidden");
    this.menu.classList.remove("hidden");
    if (this.selected && this.selected.element)
      this.selected.element.scrollIntoView({
        block: "center",
      });
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

  removeItem(name) {
    let item = this.items.find((i) => i.name === name);
    if (item === null) return;
    item.element.remove();
    this.items.splice(this.items.indexOf(item), 1);
    if (this.selected === item) this.selected = null;
  }

  selectItem(item, OnSelectFunctionEnabled = true) {
    if (this.selected) {
      if (this.selected === item) return;
      this.selected.element.classList.remove("selected");
      this.selected = item;
      item.element.classList.add("selected");
      this.button.querySelector(".ddn-selected").innerHTML =
        this.selected.element.innerHTML;
      if (OnSelectFunctionEnabled) this.onSelect();
    } else {
      this.selected = item;
      item.element.classList.add("selected");
      this.button.querySelector(".ddn-selected").innerHTML =
        this.selected.element.innerHTML;
      if (OnSelectFunctionEnabled) this.onSelect();
    }
  }

  clear() {
    this.menu.innerHTML = "";
    this.items = [];
  }
}

export class DropdownItem {
  constructor(
    element = null,
    dropdownMenu = null,
    name = null,
    iconSVG = null,
    description = null
  ) {
    if (element) {
      this.element = element;
      this.name = element.querySelector(".ddn-item-name").innerText;
      this.description = element.querySelector(
        ".ddn-item-description"
      ).innerText;
      this.icon = element.querySelector(".ddn-item-icon");
      this.dropdownMenu = dropdownMenu
        ? dropdownMenu
        : new DropdownMenu(element.parentElement);
    } else {
      this.element = document.createElement("div");
      this.element.className = "ddn-item";

      let labelElement = document.createElement("div");
      labelElement.className = "ddn-item-label";

      if (iconSVG) {
        this.icon = document.createElement("i");
        this.icon.className = "ddn-item-icon";
        this.icon.innerHTML += iconSVG;
        this.element.append(this.icon);
      } else {
        this.icon = null;
      }
      if (name) {
        let nameElement = document.createElement("div");
        nameElement.className = "ddn-item-name";
        this.name = name;
        nameElement.innerHTML += name;
        labelElement.append(nameElement);
      } else {
        let nameElement = document.createElement("div");
        nameElement.className = "ddn-item-name";
        this.name = "New Item";
        nameElement.innerHTML += "New Item";
        labelElement.append(nameElement);
      }
      if (description) {
        let descriptionElement = document.createElement("div");
        descriptionElement.className = "ddn-item-description";
        this.description = description;
        descriptionElement.innerHTML += description;
        labelElement.append(descriptionElement);
      } else {
        this.description = null;
      }
      this.element.append(labelElement);

      this.dropdownMenu = dropdownMenu ? dropdownMenu : null;
    }
    this.element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.select();
      this.dropdownMenu.toggle();
    });
  }

  add = () => (this.dropdownMenu ? this.dropdownMenu.addItem(this) : null);

  remove = () =>
    this.dropdownMenu ? this.dropdownMenu.removeItem(this.name) : null;

  select = () =>
    this.dropdownMenu ? this.dropdownMenu.selectItem(this) : null;
}

export class HolidayList {
  constructor(
    element = null,
    onSetUpcomingFunction = () =>
      console.log("This holiday list has no function on setting upcoming")
  ) {
    if (element) {
      this.element = element;
      this.items = [];
      Array.from(element.children).forEach((child) => {
        this.items.push(new HolidayItem(null, this, child.innerText));
      });
      this.upcoming = null;
    } else {
      this.element = document.createElement("div");
      this.element.className = "holidays-list";
      this.items = [];
      this.upcoming = null;
    }
    this.onSetUpcoming = onSetUpcomingFunction;
  }

  addItem(item = new HolidayItem(null, this)) {
    item.holidayList = this;
    this.items.push(item);
    this.element.append(item.element);
  }

  removeItem(name) {
    let item = this.items.find((i) => i.name === name);
    if (item === null) return;
    item.element.remove();
    this.items.splice(this.items.indexOf(item), 1);
    if (this.selected === item) this.selected = null;
  }

  setUpcoming(item) {
    if (this.upcoming) {
      if (this.upcoming === item) return;
      this.upcoming.element.classList.remove("upcoming");
      this.upcoming = item;
      item.element.classList.add("upcoming");
      this.onSetUpcoming();
    } else {
      this.upcoming = item;
      item.element.classList.add("upcoming");
      this.onSetUpcoming();
    }
  }

  clear() {
    this.element.innerHTML = "";
    this.items = [];
  }
}

export class HolidayItem {
  constructor(element = null, holidayList = null, name = null, date = null) {
    if (element) {
      this.element = element;
      this.nameElement = element.querySelector(".holidays-item-name");
      this.dateElement = element.querySelector(".holidays-item-date");
      this.name = this.nameElement.innerText;
      this.date = this.dateElement.innerText;
      this.holidayList = holidayList
        ? holidayList
        : new HolidayList(element.parentElement);
    } else {
      this.element = document.createElement("div");
      this.element.className = "holidays-item";
      this.nameElement = document.createElement("div");
      this.nameElement.className = "holidays-item-name";
      this.dateElement = document.createElement("div");
      this.dateElement.className = "holidays-item-date";
      this.element.append(this.nameElement, this.dateElement);
      if (name) {
        this.name = name;
        this.nameElement.innerText = this.name;
      } else {
        this.name = "New Item";
        this.nameElement.innerText = this.name;
      }
      if (date) {
        this.date = date;
        this.dateElement.innerText = this.date;
      } else {
        this.date = null;
        this.dateElement.innerText = " ";
      }
      this.holidayList = holidayList ? holidayList : null;
    }
  }

  add = () => (this.holidayList ? this.holidayList.addItem(this) : null);

  remove = () =>
    this.holidayList ? this.holidayList.removeItem(this.name) : null;

  setUpcoming = () =>
    this.holidayList ? this.holidayList.setUpcoming(this) : null;
}
