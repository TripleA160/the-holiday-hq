/*
=> fix the bug that prevents loading saved timezone
=> add islamic holidays
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

    console.log(countries);
  } catch (error) {
    console.error("Error fetching time zones data from API", error);
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
        upcomingHolidayName = upcomingHoliday.localName;
        upcomingHolidayTime =
          Date.UTC(date[0], date[1] - 1, date[2], 0, 0, 0) - offset;
        cName.innerHTML = upcomingHolidayName;
        cDate.innerHTML = `(${upcomingHoliday.date.replaceAll("-", "/")})`;
        holidayList.items.forEach((item) => {
          if (item.name === upcomingHolidayName) holidayList.setUpcoming(item);
        });
        console.log(holidays);
      } else yearNum++;
    }
    console.log(holidays);
  } catch (error) {
    console.error("Error fetching holidays data from API", error);
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
    let response = await fetch(
      `https://worldtimeapi.org/api/timezone/${timeZone}`
    );
    let time = await response.json();
    currDate = new Date(time.utc_datetime);
    currTime = currDate.getTime();
  } catch (error) {
    console.error("Error fetching time from API", error);
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

  let offsetSign = selectedTimeZone.split("UTC")[1][1];
  let offsetHours = parseInt(selectedTimeZone.split("UTC")[1].split(":")[0]);
  let offsetMinutes = parseInt(selectedTimeZone.split("UTC")[1].split(":")[1]);
  offset = (offsetHours * 60 + offsetMinutes) * 60 * 1000;
  if (offsetSign === "-") offset = -offset;
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
      timeZoneDdn.selectItem(timeZoneItem);
  }

  if (!timeZoneDdn.selected) timeZoneDdn.selectItem(timeZoneDdn.items[0]);

  firstUpdate = false;
}

async function updateHolidayList() {
  holidayList.clear();
  holidays.forEach((holiday) => {
    holidayList.addItem(new HolidayItem(null, null, holiday.localName));
  });
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
  console.log("Current Time (currTime): ", new Date(currTime).toISOString());
  console.log(
    "Holiday Time (upcomingHolidayTime): ",
    new Date(upcomingHolidayTime).toISOString()
  );
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
  updateCounter();
  updateInterval = setInterval(updateCounter, 1000);
  fetchInterval = setInterval(fetchTime, 600000);
}

async function handleCountrySelection() {
  countryDdn.selected?.name
    ? localStorage.setItem("selectedCountry", countryDdn.selected.name)
    : localStorage.setItem("selectedCountry", "None");

  await updateTimeZoneDropdown();
  timeZoneDdn.selectItem(timeZoneDdn.items[0]);
  await startCountdown();
}
async function handleTimeZoneSelection() {
  timeZoneDdn.selected?.name
    ? localStorage.setItem("selectedTimeZone", timeZoneDdn.selected.name)
    : localStorage.setItem("selectedTimeZone", "None");

  await startCountdown();
}

async function handleUpcomingHoliday() {}

fetchCountries();
