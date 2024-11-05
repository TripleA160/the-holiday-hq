/*
=> add a settings menu for countries and timezones with toggle button with country flag as the menu icon
=> add other countries to countries.json
=> add national extra holidays for other countries
=> add more years for extra holidays
*/

import {
  DropdownMenu,
  DropdownItem,
  HolidayList,
  HolidayItem,
} from "./module.js";

const header = document.querySelector("#header");
const options = document.querySelector("#options");
const content = document.querySelector("#content");
const countryDdn = new DropdownMenu(
  options.querySelector("#country-ddn"),
  handleCountrySelection
);
const timeZoneDdn = new DropdownMenu(
  options.querySelector("#time-zone-ddn"),
  handleTimeZoneSelection
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

let countries = [];
let countriesFetched = false;

let countryCode = null;
let timeZone = null;

let currDate = null;
let currTime = null;
let upcomingHoliday = null;
let upcomingHolidayName = null;
let upcomingHolidayTime = null;
let holidays = null;
let offset = 0;

let updateInterval = null;
let fetchInterval = null;

async function fetchCountries() {
  if (countriesFetched) return;
  try {
    let response = await fetch("./countries.json");
    countries = await response.json();
    countries.sort((a, b) => {
      let aN = a.countryName.toLowerCase();
      let bN = b.countryName.toLowerCase();
      if (aN < bN) return -1;
      if (bN > aN) return 1;
      return 0;
    });
    countriesFetched = true;

    await updateCountryDropdown();

    console.log(`\nFetched Countries`);
    console.log(countries);
  } catch (error) {
    console.error("Error fetching time zones data", error);
  }
}

async function fetchHolidays(year, lastYear = 2040) {
  try {
    let yearNum = parseInt(year);
    while (!upcomingHoliday && yearNum < lastYear) {
      let response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${yearNum}/${countryCode}`
      );
      holidays = await response.json();
      await fetchExtraHolidays(yearNum);
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
        console.log(`\nFetched Holidays`);
        console.log(holidays);
      } else yearNum++;
    }
  } catch (error) {
    holidays = [];
    console.error("Error fetching holidays data", error);
  }
}

async function fetchExtraHolidays(year) {
  try {
    let response = await fetch("./extra-holidays.json");
    let extraHolidays = await response.json();
    extraHolidays[year].forEach((h) => {
      if (h.countries.includes(countryDdn.selected.name)) holidays.push(h);
    });
  } catch (error) {
    console.error("Error fetching extra holidays", error);
  }
}

async function fetchTime() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    let ip = data.ip;
    try {
      let response = await fetch(
        `https://timeapi.io/api/time/current/ip?ipAddress=${ip}`
      );
      let time = await response.json();
      currDate = new Date(time.dateTime + "Z");
      currTime = currDate.getTime();
      console.log(`\nFetched Time`);
      console.log(currDate.toISOString());
    } catch (error) {
      console.error("Error fetching time", error);
    }
  } catch (error) {
    console.error("Error fetching IP address", error);
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
    (c) => c.countryName === countryDdn.selected.name
  );
  let selectedTimeZone = timeZoneDdn.selected.name;

  countryCode = selectedCountry.countryCode;

  timeZone = selectedTimeZone.split(" ")[0];

  let offsetHours = parseInt(selectedTimeZone.split("UTC")[1].split(":")[0]);
  let offsetMinutes = parseInt(selectedTimeZone.split("UTC")[1].split(":")[1]);
  offset = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
}

async function updateCountryDropdown() {
  let storedCountry = localStorage.getItem("selectedCountry");

  countryDdn.clear();

  for (let i = 0; i < countries.length; i++) {
    let countryItem = new DropdownItem(null, null, countries[i].countryName);

    countryDdn.addItem(countryItem);

    if (storedCountry && countries[i].countryName === storedCountry)
      countryDdn.selectItem(countryItem);
  }

  if (!countryDdn.selected) countryDdn.selectItem(countryDdn.items[0]);
}

let firstUpdate = true;
async function updateTimeZoneDropdown() {
  let storedTimeZone = localStorage.getItem("selectedTimeZone");

  let selectedCountry = countries.find(
    (c) => c.countryName === countryDdn.selected.name
  );
  if (!selectedCountry) return;

  let timeZones = selectedCountry.timeZones;
  let offsets = selectedCountry.offsets;

  timeZoneDdn.clear();

  for (let i = 0; i < timeZones.length; i++) {
    let timeZoneName = `${timeZones[i]} ${offsets[i]}`;
    let timeZoneItem = new DropdownItem(null, null, timeZoneName);

    timeZoneDdn.addItem(timeZoneItem);

    if (firstUpdate && storedTimeZone && timeZoneName === storedTimeZone)
      timeZoneDdn.selectItem(timeZoneItem, false);
    else if (i === timeZones.length - 1)
      timeZoneDdn.selectItem(timeZoneDdn.items[0]);
  }

  firstUpdate = false;
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
  await fetchCountries();
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
  countryDdn.selected?.name
    ? localStorage.setItem("selectedCountry", countryDdn.selected.name)
    : localStorage.setItem("selectedCountry", "None");

  await updateTimeZoneDropdown();
  await startCountdown();
}
async function handleTimeZoneSelection() {
  timeZoneDdn.selected?.name
    ? localStorage.setItem("selectedTimeZone", timeZoneDdn.selected.name)
    : localStorage.setItem("selectedTimeZone", "None");

  await startCountdown();
}

async function handleUpcomingHoliday() {}

function checkLanguage() {
  if (isLocal === "false") {
    upcomingHolidayName = upcomingHoliday.name;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "En";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "English Names";
    languageBtn.setAttribute("title", "Switch to Local Names");
  } else if (isLocal === "true") {
    upcomingHolidayName = upcomingHoliday.localName;
    languageLabel.querySelector(".language-switch-label-short").innerText =
      "Loc";
    languageLabel.querySelector(".language-switch-label-full").innerText =
      "Local Names";
    languageBtn.setAttribute("title", "Switch to English Names");
  } else {
    localStorage.setItem("isLocal", "true");
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
function isRTL(text) {
  const rtlPattern =
    /[\u0590-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB1D-\uFDFD\uFE70-\uFEFF]/;
  return rtlPattern.test(text);
}

languageBtn.addEventListener("click", switchLanguage);

fetchCountries();
