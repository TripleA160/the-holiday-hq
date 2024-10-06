/*
=> Add a dropdown menu for countries
=> Find a way to deal with countries with multiple time zones
*/

const countdown = document.querySelector(".countdown");
const cDays = countdown.querySelector(".digit-days");
const cHours = countdown.querySelector(".digit-hours");
const cMinutes = countdown.querySelector(".digit-minutes");
const cSeconds = countdown.querySelector(".digit-seconds");
const cName = countdown.querySelector(".countdown-name");
const cDate = countdown.querySelector(".countdown-date");

let timeZones = [];

let countryName = "Egypt";
let countryCode = null;
let timeZone = null;

let currDate = null;
let currTime = null;
let upcomingHoliday = null;
let upcomingHolidayName = null;
let upcomingHolidayTime = null;
let holidays = null;

async function fetchTimeZones() {
  try {
    let response = await fetch("./countries.json");
    timeZones = await response.json();
    console.log(timeZones);
  } catch (error) {
    console.error("Error fetching time zones data from API", error);
  }
}

async function fetchHolidays(year, maxYear = 2040) {
  try {
    let yearNum = parseInt(year);
    while (!upcomingHoliday && yearNum < maxYear) {
      let response = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${yearNum}/${countryCode}`
      );
      holidays = await response.json();
      for (let i = 0; i < holidays.length; i++) {
        if (new Date(holidays[i].date).getTime() > currTime) {
          upcomingHoliday = holidays[i];
          break;
        }
      }
      if (upcomingHoliday) {
        upcomingHolidayName = upcomingHoliday.localName;
        upcomingHolidayTime = new Date(upcomingHoliday.date).getTime();
        cName.innerHTML = upcomingHolidayName;
        cDate.innerHTML = `(${upcomingHoliday.date.replaceAll("-", "/")})`;
        console.log(holidays);
      } else yearNum++;
    }
  } catch (error) {
    console.error("Error fetching holidays data from API", error);
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
  let country = timeZones.find((c) => c.countryName === countryName);
  countryCode = country.countryCode;
  timeZone = country.timeZone;
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
    clearInterval(updateInterval);
    clearInterval(fetchInterval);
    cDays.innerHTML = "00";
    cHours.innerHTML = "00";
    cMinutes.innerHTML = "00";
    cSeconds.innerHTML = "00";
    alert("It's holiday time!");
  }
}

async function startCountdown() {
  await fetchTimeZones();
  await updateCountry();
  await fetchTime();
  await fetchHolidays(currDate.getFullYear());
  updateCounter();

  const updateInterval = setInterval(updateCounter, 1000);

  const fetchInterval = setInterval(fetchTime, 600000);
}

startCountdown();
