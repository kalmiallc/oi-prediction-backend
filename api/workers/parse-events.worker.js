


import SportEventModel from "../../api/models.js";
import { createUid, getGenderByIndex, getSportIndex } from "../../api/utils.js";
import { EVENTS_URL, getBuildId, PARSE_SPORTS, UrlSportEncoding } from "../events-scrapping.js";
import Sports from "../types.js";


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
  const regex = /\b(Group [A-Z]|Preliminary Round(?: - (?:Group|Pool) [A-Z])?|Preliminary Match|Pool [A-Z]|Pool Round|Group play stage|Quarter(?:-?finals?)?|Semi(?:-?finals?)?|Play-in Games|Round of 16|Bronze Medal (?:Game|Match)|Gold Medal (?:Game|Match)|Classification \d+(?:th)?-\d+(?:th)?)\b/i;
  const match = eventString.match(regex);
  return match ? match[0] : 'None';
}

/**
 * Parses events.
 */
export async function parseEvents() {
  const buildId = await getBuildId();
  if (!buildId) {
    throw new Error('No build ID found.')
  }

  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    const sportEncoding = UrlSportEncoding[sport];

    const url = EVENTS_URL(sportEncoding, buildId)
    try {
      let res = await fetch(url);
      console.log(url)
      console.log(res.status)
      console.log(res.statusText)
      // res = await res.json();

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


        let uid = undefined;
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

      throw error;
    }
  }
}

/**
 * Worker handler.
 * @param {*} req Request.
 * @param {*} res Response.
 */
export default function handler(req, res) {
  parseEvents()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}
