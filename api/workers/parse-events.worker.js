


import { createUid, getGenderByIndex, getSportIndex } from "../../api/utils.js";
import Sports from "../types.js";
import SportEventModel from "../../api/models.js";
/**
 * Full schedule URL.
 */
const SCHEDULE_URL = 'https://olympics.com/en/paris-2024/schedule';

/**
 * Returns URL for specific sport.
 * @param {*} sport 
 * @param {*} buildId 
 * @returns 
 */
const EVENTS_URL = (sport, buildId) => `https://olympics.com/_next/data/${buildId}/en/paris-2024/schedule/${sport}.json?deviceType=desktop&countryCode=AX&path=paris-2024&path=schedule&path=${sport}`


/**
 * URL encodings for specific sport.
 */
const UrlSportEncoding = {
  Basketball: "basketball",
  Basketball3x3: "3x3-basketball",
  Badminton: "badminton",
  BeachVolley: "beach-volleyball",
  FieldHockey: "hockey",
  Football: "football",
  Handball: "handball",
  TableTennis: "table tennis",
  Tennis: "tennis",
  Volleyball: "volleyball",
  WaterPolo: "water-polo",
};

function getGender(eventString) {
  let regex = /(Men|Women|Mixed)/;
  let match = eventString.match(regex);

  if (!match || !match[0]) {
    regex = /(WS|WD|MS|MD|XD)/;

    match = eventString.match(regex);
    if (match && match[0]) {
      if (match[0] === 'WS' || match[0] === 'WD') {
        return 'Women';
      } else if(match[0] === 'XD') {
        return 'Mixed';
      }else {
        return 'Men';
      }
    }
  }

  return match ? match[0] : null;
}

function getGroup(eventString) {
  const regex = /\b(Group [A-Z]|Preliminary Round(?: - Group [A-Z]| - Pool [A-Z])?|Pool [A-Z]|Quarter(?:-?finals?)?|Semi(?:-?finals?)?|Play-in Games|Round of 16|Bronze Medal (?:Game|Match)|Gold Medal (?:Game|Match)|Classification \d+(?:th)?-\d+(?:th)?)\b/i;
  const match = eventString.match(regex);
  return match ? match[0] : null;
}


async function parseEvents() {

  let htmlResponse = null;
  try {
    const res = await fetch(SCHEDULE_URL);
    htmlResponse = await res.text();
  } catch (error) {
    console.log(error);

    throw error;
  }

  let buildId = null;
  if (htmlResponse) {
    const match = htmlResponse.match(/"buildId":"(.*?)"/);
    if (match[1]) {
      buildId = match[1]
    }
  }

  if (!buildId) {
    throw new Error('No build ID found.')
  }



  const keys = new Set();

  const sports = Object.keys(Sports);
  for (const sport of sports) {
    const sportEncoding = UrlSportEncoding[sport];
    const url = EVENTS_URL(sportEncoding, buildId)

    try {
      let res = await fetch(url);
      res = await res.json()

      let schedule = [];
      const scheduleWrapper = res.pageProps.page.items.find(i => i.name === 'scheduleWrapper');
      if (scheduleWrapper) {
        const units = scheduleWrapper.data.schedules;

        for (const unit of units) {
          schedule = [...schedule, ...unit.units];
        }
      }

      const parsedSchedule = [];
      for (const match of schedule) {
        const parsedDate = new Date(match.startDateTimeUtc).toISOString();

        const teams = [];
        let choice1 = null;
        let choice2 = null;
        let matchName = match.description;

        if (match.match?.team1 && match.match?.team2) {
          teams.push(match.match.team1.description);
          teams.push(match.match.team2.description);
          matchName += ` - ${teams.join(' vs ')}`

          choice1 = teams[0];
          choice2 = teams[1];
        }

        keys.add(keys.add(match.description));
        

        const gender = getGender(match.description);
        const startTimeEpoch = new Date(match.startDateTimeUtc).getTime() / 1000;
        const sportIndex = getSportIndex(sport);
        const genderIndex = getGenderByIndex(gender);
        const uid = createUid(sportIndex, genderIndex, startTimeEpoch, teams);
        const group = getGroup(match.description);
        

        const parsedMatch = {
          date: parsedDate[0],
          time: parsedDate[1].substring(0,4),
          gender: gender,
          genderByIndex: genderIndex,
          group,
          sport: Sports[sport],
          sportByIndex: sportIndex,
          teams,
          uid,
          match: matchName,
          choice1,
          choice2,
          initialBets1: 10,
          initialBets2: 10,
          initialBets3: 10,
          initialPool: 600,
          winner: null
        };

        parsedSchedule.push(parsedMatch);
      }

      await SportEventModel.insertMany(parsedSchedule);
    } catch (error) {
      console.log(error);
    }

  }

}

export default parseEvents;
