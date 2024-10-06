/*
=> Find the best practise for time zones, country codes and country names.
*/

const countdown = document.querySelector(".countdown");
const cDays = countdown.querySelector(".digit-days");
const cHours = countdown.querySelector(".digit-hours");
const cMinutes = countdown.querySelector(".digit-minutes");
const cSeconds = countdown.querySelector(".digit-seconds");
const cName = countdown.querySelector(".countdown-name");
const cDate = countdown.querySelector(".countdown-date");

let timeZones = {
  EG: "Africa/Cairo",
};

let country = "EG";
let timezone = "Africa/Cairo";

let currDate = null;
let currTime = null;
let upcomingHoliday = null;
let upcomingHolidayName = null;
let upcomingHolidayTime = null;
let holidays = null;

async function fetchTimeZones() {
  try {
    let response = await fetch("./time-zones.json");
    timeZones = await response.json();
    console.log(timeZones);
  } catch (error) {
    console.error("Error fetching time zones data from API", error);
  }
}

async function fetchHolidays() {
  try {
    let response = await fetch(
      "https://date.nager.at/api/v3/PublicHolidays/" +
        currDate.getFullYear() +
        "/" +
        country
    );
    holidays = await response.json();
    for (let i = 0; i < holidays.length; i++) {
      if (new Date(holidays[i].date).getTime() > currTime) {
        upcomingHoliday = holidays[i];
        break;
      }
    }
    upcomingHolidayName = upcomingHoliday.localName;
    upcomingHolidayTime = new Date(upcomingHoliday.date).getTime();
    cName.innerHTML = upcomingHolidayName;
    cDate.innerHTML = `(${upcomingHoliday.date.replaceAll("-", "/")})`;
    console.log(holidays);
  } catch (error) {
    console.error("Error fetching holidays data from API", error);
  }
}

async function fetchTime() {
  try {
    let response = await fetch(
      "https://worldtimeapi.org/api/timezone/" + timezone
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
  await fetchTime();
  await fetchHolidays();
  updateCounter();

  const updateInterval = setInterval(updateCounter, 1000);

  const fetchInterval = setInterval(fetchTime, 300000);
}

startCountdown();
