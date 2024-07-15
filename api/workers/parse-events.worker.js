


import { createUid, getGenderByIndex, getSportIndex } from "../../api/utils.js";
import Sports from "../types.js";
import SportEventModel from "../../api/models.js";


/**
 * Which sports should be parsed.
 */
const PARSE_SPORTS = [
  Sports.Basketball,
  Sports.Basketball3x3,
  Sports.FieldHockey,
  Sports.Football,
  Sports.Handball,
  Sports.Volleyball,
  Sports.WaterPolo,
]

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
  TableTennis: "table-tennis",
  Tennis: "tennis",
  Volleyball: "volleyball",
  WaterPolo: "water-polo",
};

/**
 * Parses gender out of event description.
 * @param {*} eventString Event string.
 * @returns Parsed gender.
 */
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

/**
 * Checks if certain sports event can be tied.
 * @param {*} sport Sport.
 * @param {*} description Event description.
 * @param {*} teams Teams.
 * @returns Boolean.
 */
function canBeTied(sport, description, teams) {
  sport = Sports[sport];

  const NO_TIES = [Sports.Basketball, Sports.Basketball3x3, Sports.Badminton, Sports.BeachVolley, Sports.Volleyball, Sports.TableTennis, Sports.Tennis]
  if (NO_TIES.includes(sport)) {
    return false;
  }

  if (teams.length < 2) {
    return false;
  }

  description = description.toLowerCase();
  switch (sport) {
    case Sports.FieldHockey:
      if (description.includes('pool')) {
        return true;
      }

    case Sports.Football:
      if (description.includes('group')) {
        return true;
      }

    case Sports.Handball:
      if (description.includes('preliminary round') || description.includes('group')) {
        return true;
      }

    case Sports.WaterPolo:
      if (description.includes('preliminary round') || description.includes('group')) {
        return true;
      }

    default:
      return false;
  }
}

/**
 * Parses group out of event description.
 * @param {*} eventString Event string.
 * @returns Parsed group.
 */
function getGroup(eventString) {
  const regex = /\b(Group [A-Z]|Preliminary Round(?: - Group [A-Z]| - Pool [A-Z])?|Pool [A-Z]|Quarter(?:-?finals?)?|Semi(?:-?finals?)?|Play-in Games|Round of 16|Bronze Medal (?:Game|Match)|Gold Medal (?:Game|Match)|Classification \d+(?:th)?-\d+(?:th)?)\b/i;
  const match = eventString.match(regex);
  return match ? match[0] : null;
}


/**
 * Parses events.
 */
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

  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    const sportEncoding = UrlSportEncoding[sport];

    const url = EVENTS_URL(sportEncoding, buildId)
    try {
      let res = await fetch(url);
      res = await res.json();

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
        const parsedDate = new Date(match.startDateTimeUtc).toISOString().split('T');

        const teams = [];
        const choices = [];
        let matchName = match.description;

        if (match.match?.team1 && match.match?.team2) {
          teams.push(match.match.team1.description);
          teams.push(match.match.team2.description);
          matchName += ` - ${teams.join(' vs ')}`;

          choices.push({
            choice: teams[0],
            initialBet: 10
          });
          choices.push({
            choice: teams[1],
            initialBet: 10
          });

          if (canBeTied(sport, match.description, teams)) {
            choices.push({
              choice: 'DRAW',
              initialBet: 10
            });
          }
        }

        const gender = getGender(match.description);
        const startTimeEpoch = new Date(match.startDateTimeUtc).getTime() / 1000;
        const endTimeEpoch = new Date(match.endDateTimeUtc).getTime() / 1000;
        const sportIndex = getSportIndex(sport);
        const genderIndex = getGenderByIndex(gender);
        const group = getGroup(match.description);


        let uid = null;
        if (teams.length >= 2 && choices.length >= 2) {
          uid = createUid(sportIndex, genderIndex, startTimeEpoch, teams);
        }

        const parsedMatch = {
          date: parsedDate[0],
          time: parsedDate[1].substring(0,5),
          gender: gender,
          startTime: startTimeEpoch,
          endTime: endTimeEpoch,
          genderByIndex: genderIndex,
          group,
          sport: Sports[sport],
          sportByIndex: sportIndex,
          teams,
          choices,
          uid,
          match: matchName,
          initialPool: 60,
          winner: null,
          _externalId: match.unitCode
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
