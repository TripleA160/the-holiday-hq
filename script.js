/*
=> add code to deal with other holidays date
*/

import {
  DropdownMenu,
  DropdownItem,
  HolidayList,
  HolidayItem,
} from "./module.js";
import countriesData from './countries.json' with { type: 'json' };
import otherHolidaysData from './other-holidays.json' with { type: 'json' };

const header = document.querySelector("#header");
const options = document.querySelector("#options");
const content = document.querySelector("#content");
const regionSettingsBtn = options.querySelector(".region-settings-btn");
const regionSelectedFlag = options.querySelector(".region-settings-flag");
const regionSettings = options.querySelector("#region-settings");
const countryDdn = new DropdownMenu(
  regionSettings.querySelector("#country-ddn"),
  handleCountrySelection
);
const timeZoneDdn = new DropdownMenu(
  regionSettings.querySelector("#time-zone-ddn"),
  handleTimeZoneSelection
);
const timeZoneToggleCheckbox = regionSettings.querySelector(
  ".time-zone-toggle-checkbox"
);
const timeZoneToggleLabel = regionSettings.querySelector(
  ".time-zone-toggle-label"
);
const languageBtn = options.querySelector(".language-switch-btn");
const languageLabel = options.querySelector(".language-switch-label");
const holidayList = new HolidayList(
  content.querySelector(".holidays-list"),
  handleUpcomingHoliday
);
const countdown = content.querySelector(".countdown");
const cDays = countdown.querySelector(".digit-days");
const cHours = countdown.querySelector(".digit-hours");
const cMinutes = countdown.querySelector(".digit-minutes");
const cSeconds = countdown.querySelector(".digit-seconds");
const cName = countdown.querySelector(".countdown-name");
const cDate = countdown.querySelector(".countdown-date");

let isLocal = localStorage.getItem("isLocal");
let isCountryTime = localStorage.getItem("isCountryTime");

let userIP = null;
let userCountry = null;

let countries = countriesData.sort((a, b) => {
      let aN = a.name.toLowerCase();
      let bN = b.name.toLowerCase();
      if (aN < bN) return -1;
      if (bN > aN) return 1;
      return 0});

let userIPFetched = false;
let countriesFetched = false;

let countryCode = null;
let timeZone = null;

let currDate = null;
let currTime = null;
let upcomingHoliday = null;
let upcomingHolidayName = null;
let upcomingHolidayTime = null;
let holidays = [];
let offset = 0;

let updateInterval = null;
let fetchInterval = null;

async function fetchUserIP() {
  if (userIPFetched) return;
  try {
    const response = await fetch("https://api.ipapi.is/?key=d7a4c822df3e60c3");
    const data = await response.json();
    userIP = data.ip;
    userCountry = data.location.country;
    userIPFetched = true;

    await updateCountryDropdown();

    console.log(`\nFetched IP`);
    console.log(userIP + "\n" + userCountry);
  } catch (error) {
    console.error("Error fetching IP address,\nCountry time will be used", error);
  }
}

async function fetchHolidays(firstYear, lastYear = 2040) {
  let year = parseInt(firstYear);
  let apiFailed = false;
  while (!upcomingHoliday && year < lastYear) {
    try {
      let response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
      );
      holidays = await response.json();
      if (otherHolidaysData[countryCode])
        otherHolidaysData[countryCode][year]?.forEach((h)=>holidays.push(h));
      holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

      for (let i = 0; i < holidays.length; i++) {
        if (new Date(holidays[i].date).getTime() > currTime) {
          upcomingHoliday = holidays[i];
          break;
        }
      }
      await updateHolidayList();

      if (upcomingHoliday) {
        let date = upcomingHoliday.date.split("-");
        upcomingHolidayName =
          isLocal === "true" ? upcomingHoliday.localName : upcomingHoliday.name;
        upcomingHolidayTime = Date.UTC(date[0], date[1] - 1, date[2], 0, 0, 0);
        cName.innerHTML = upcomingHolidayName;
        cDate.innerHTML = `(${upcomingHoliday.date.replaceAll("-", "/")})`;
      } else year++;
    } catch {
      apiFailed = true;
      break;
    }
  }

  if (apiFailed) {
    year = parseInt(firstYear);

    if (otherHolidaysData[countryCode][year]) {
      while (!upcomingHoliday && year < lastYear) {
        holidays = otherHolidaysData[countryCode][year];
      holidays.sort((a, b) => new Date(a.date) - new Date(b.date));

      for (let i = 0; i < holidays.length; i++) {
        if (new Date(holidays[i].date).getTime() > currTime) {
          upcomingHoliday = holidays[i];
          break;
        }
      }
      await updateHolidayList();

      if (upcomingHoliday) {
        let date = upcomingHoliday.date.split("-");
        upcomingHolidayName =
          isLocal === "true" ? upcomingHoliday.localName : upcomingHoliday.name;
        upcomingHolidayTime = Date.UTC(date[0], date[1] - 1, date[2], 0, 0, 0);
        cName.innerHTML = upcomingHolidayName;
        cDate.innerHTML = `(${upcomingHoliday.date.replaceAll("-", "/")})`;
      } else year++;
      }
    }
    
  if (holidays.length === 0 || holidays === null)
    console.error("Error fetching holidays");
  }
}

async function fetchTime() {
  checkCountryTime();

  if (isCountryTime === "false" && userIP != null) {
    try {
        let response = await fetch(
          `https://timeapi.io/api/time/current/ip?ipAddress=${userIP}`
        );
        let time = await response.json();
        currDate = new Date(time.dateTime + "Z");
        currTime = currDate.getTime();
      } catch (error) {
        console.error("Error fetching time", error);
      }
  } else {
    try {
      let response = await fetch(
        `https://timeapi.io/api/time/current/zone?timeZone=GMT`
      );
      let time = await response.json();
      currDate = new Date(time.dateTime + "Z");
      currTime = currDate.getTime() + offset;
    } catch (error) {
      console.error("Error fetching time", error);
    }
  }
}

function toDays(milliseconds) {
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
}
function toHours(milliseconds) {
  return Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
}
function toMinutes(milliseconds) {
  return Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
}
function toSeconds(milliseconds) {
  return Math.floor((milliseconds % (1000 * 60)) / 1000);
}

async function updateCountry() {
  let selectedCountry = countries.find(
    (c) => c.name === countryDdn.selected.name
  );
  let selectedTimeZone = `${timeZoneDdn.selected.name} ${timeZoneDdn.selected.description}`;

  countryCode = selectedCountry.code;

  timeZone = selectedTimeZone.split(" ")[0];

  let offsetHours = parseInt(selectedTimeZone.split("GMT")[1].split(":")[0]);
  let offsetMinutes = parseInt(selectedTimeZone.split("GMT")[1].split(":")[1]);
  offset = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
}

let firstCountryUpdate = true;

async function updateCountryDropdown() {
  let storedCountry = localStorage.getItem("selectedCountry");

  countryDdn.clear();

  for (let i = 0; i < countries.length; i++) {
    let countryItem = new DropdownItem(
      null,
      null,
      countries[i].name,
      countries[i].flagSVG,
      countries[i].localName
    );

    countryDdn.addItem(countryItem);

    if (
      firstCountryUpdate &&
      storedCountry &&
      countries[i].name === storedCountry
    )
      countryDdn.selectItem(countryItem);
    else if (i === countries.length - 1) {
      let isSelectedValid = countries.find((country) =>
        country.name.trim().toLowerCase() === countryDdn.selected.name.trim().toLowerCase()
      )
      if (isSelectedValid) return;
      else if (userCountry != null) {
        let isUserCountryValid = countries.find((country) => country.name.trim().toLowerCase() === userCountry.trim().toLowerCase());
        if (isUserCountryValid) {
          countryDdn.selectItem(countryDdn.items.find((item) => item.name.trim().toLowerCase() === userCountry.trim().toLowerCase()));
        }
      } else {
        console.log("User country is NULL,\nFirst country is selected");
        countryDdn.selectItem(countryDdn.items[0]);
      }
    }
  }

  firstCountryUpdate = false;
}

let firstTimeZoneUpdate = true;

async function updateTimeZoneDropdown() {
  let storedTimeZone = localStorage.getItem("selectedTimeZone");

  let selectedCountry = countries.find(
    (c) => c.name === countryDdn.selected.name
  );
  if (!selectedCountry) return;

  let timeZones = selectedCountry.timeZones;
  let offsets = selectedCountry.offsets;

  timeZoneDdn.clear();
  for (let i = 0; i < timeZones.length; i++) {
    let timeZoneName = `${timeZones[i]} ${offsets[i]}`;
    let timeZoneItem = new DropdownItem(
      null,
      null,
      timeZones[i],
      null,
      offsets[i]
    );

    timeZoneDdn.addItem(timeZoneItem);

    if (
      firstTimeZoneUpdate &&
      storedTimeZone &&
      timeZoneName === storedTimeZone
    )
      timeZoneDdn.selectItem(timeZoneItem, false);
    else if (i === timeZones.length - 1) {
      let isSelectedValid = timeZones.find((timeZone) =>
        timeZone.trim().toLowerCase() === timeZoneDdn.selected.name.trim().toLowerCase()
      )
      if (isSelectedValid) return;
      else {
        timeZoneDdn.selectItem(timeZoneDdn.items[0]);
      }
    }
  }

  firstTimeZoneUpdate = false;
}

async function updateHolidayList() {
  holidayList.clear();
  for (let i = 0; i < holidays.length; i++) {
    if (i > 0 && holidays[i].name === holidays[i - 1].name) continue;

    let hName = isLocal === "true" ? holidays[i].localName : holidays[i].name;
    let hItem = new HolidayItem(
      null,
      null,
      hName,
      holidays[i].date.replaceAll("-", "/")
    );
    holidayList.addItem(hItem);
    if (upcomingHoliday && upcomingHolidayName === hName) hItem.setUpcoming();
  }
  if (isLocal === "true" && isRTL(holidays[0].localName))
    holidayList.element.style.flexDirection = "row-reverse";
  else holidayList.element.style.flexDirection = "row";
}

function updateCounter() {
  let timeDiff = upcomingHolidayTime - currTime;

  let days = toDays(timeDiff);
  let hours = toHours(timeDiff);
  let minutes = toMinutes(timeDiff);
  let seconds = toSeconds(timeDiff);

  cDays.innerHTML = days;
  cHours.innerHTML = String(hours).padStart(2, "0");
  cMinutes.innerHTML = String(minutes).padStart(2, "0");
  cSeconds.innerHTML = String(seconds).padStart(2, "0");

  currTime += 1000;

  if (timeDiff <= 0) {
    clearIntervals();
    cDays.innerHTML = "00";
    cHours.innerHTML = "00";
    cMinutes.innerHTML = "00";
    cSeconds.innerHTML = "00";
    alert("It's holiday time!");
  }
}

async function clearIntervals() {
  clearInterval(updateInterval);
  clearInterval(fetchInterval);
}

async function startCountdown() {
  upcomingHoliday = null;
  holidays = null;
  await fetchUserIP();
  await updateCountry();
  await fetchTime();
  await fetchHolidays(currDate.getFullYear());
  await clearIntervals();
  checkLanguage();
  updateCounter();
  updateInterval = setInterval(updateCounter, 1000);
  fetchInterval = setInterval(fetchTime, 600000);
}

async function handleCountrySelection() {
  if (countryDdn.selected?.name) {
    localStorage.setItem("selectedCountry", countryDdn.selected.name);
    regionSelectedFlag.innerHTML = countryDdn.selected.icon.innerHTML;
  } else {
    localStorage.setItem("selectedCountry", "None");
  }

  await updateTimeZoneDropdown();
  await startCountdown();
}
async function handleTimeZoneSelection() {
  timeZoneDdn.selected?.name
    ? localStorage.setItem(
        "selectedTimeZone",
        `${timeZoneDdn.selected.name} ${timeZoneDdn.selected.description}`
      )
    : localStorage.setItem("selectedTimeZone", "None");

  await startCountdown();
}

async function handleUpcomingHoliday() {}

function switchLanguage() {
  isLocal = localStorage.getItem("isLocal");
  if (isLocal === "true") {
    localStorage.setItem("isLocal", "false");
    isLocal = "false";
    upcomingHolidayName = upcomingHoliday.name;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "En";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "English Names";
    languageBtn.setAttribute("title", "Switch to Local Names");
  } else {
    localStorage.setItem("isLocal", "true");
    isLocal = "true";
    upcomingHolidayName = upcomingHoliday.localName;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "Loc";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "Local Names";
    languageBtn.setAttribute("title", "Switch to English Names");
  }
  cName.innerHTML = upcomingHolidayName;
  updateHolidayList();
}
function checkLanguage() {
  isLocal = localStorage.getItem("isLocal");
  if (isLocal === "false") {
    upcomingHolidayName = upcomingHoliday.name;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "En";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "English Names";
    languageBtn.setAttribute("title", "Switch to Local Names");
  } else {
    localStorage.setItem("isLocal", "true");
    isLocal = "true";
    upcomingHolidayName = upcomingHoliday.localName;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "Loc";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "Local Names";
    languageBtn.setAttribute("title", "Switch to English Names");
  }
  cName.innerHTML = upcomingHolidayName;
  updateHolidayList();
}
function isRTL(text) {
  const rtlPattern =
    /[\u0590-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFF]/;
  return rtlPattern.test(text);
}

function toggleCountryTime() {
  let iconUnchecked = timeZoneToggleCheckbox.querySelector(
    ".checkbox-icon-unchecked"
  );
  let iconChecked = timeZoneToggleCheckbox.querySelector(
    ".checkbox-icon-checked"
  );
  isCountryTime = localStorage.getItem("isCountryTime");

  if (isCountryTime === "false") {
    localStorage.setItem("isCountryTime", "true");
    isCountryTime = "true";
    iconUnchecked.classList.add("hidden");
    iconChecked.classList.remove("hidden");
    timeZoneDdn.element.classList.remove("hidden");
  } else {
    localStorage.setItem("isCountryTime", "false");
    isCountryTime = "false";
    iconUnchecked.classList.remove("hidden");
    iconChecked.classList.add("hidden");
    timeZoneDdn.element.classList.add("hidden");
  }
  startCountdown();
}
function checkCountryTime() {
  let iconUnchecked = timeZoneToggleCheckbox.querySelector(
    ".checkbox-icon-unchecked"
  );
  let iconChecked = timeZoneToggleCheckbox.querySelector(
    ".checkbox-icon-checked"
  );
  isCountryTime = localStorage.getItem("isCountryTime");

  if (isCountryTime === "true") {
    iconUnchecked.classList.add("hidden");
    iconChecked.classList.remove("hidden");
    timeZoneDdn.element.classList.remove("hidden");
  } else {
    localStorage.setItem("isCountryTime", "false");
    isCountryTime = "false";
    iconUnchecked.classList.remove("hidden");
    iconChecked.classList.add("hidden");
    timeZoneDdn.element.classList.add("hidden");
  }
}

document.documentElement.addEventListener("click", () => {
  if (!regionSettings.classList.contains("hidden")) {
    regionSettings.classList.add("hidden");
    regionSettingsBtn.classList.remove("clicked");
  }
});
regionSettings.addEventListener("click", (e) => {
  e.stopPropagation();
  countryDdn?.close();
  timeZoneDdn?.close();
});
regionSettingsBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  countryDdn?.close();
  timeZoneDdn?.close();
  regionSettings.classList.toggle("hidden");
  regionSettingsBtn.classList.toggle("clicked");
});
timeZoneToggleCheckbox.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleCountryTime();
});
timeZoneToggleLabel.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleCountryTime();
});
languageBtn.addEventListener("click", switchLanguage);

fetchUserIP();
