import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import { PARSE_SPORTS } from "../../lib/events-scrapping.js";
import SportEventModel from "../../lib/models.js";
import { getSchedule } from '../../lib/olympics-api.js';
import { Sports } from "../../lib/types.js";
import { addEvent } from "../../lib/blockchain.js";
import { createUid, getGenderByIndex, getSportIndex, sleep } from "../../lib/utils.js";

/**
 * Parses gender out of event description.
 * @param {*} eventString Event string.
 * @returns Parsed gender.
 */
function getGenderFromDescription(eventString) {
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

function dateToUtc(dateString) {
   const date = new Date(dateString);
   const utcDateTime = date.toISOString();

   return utcDateTime;
}

function includesWinnerOrLooser(team1, team2) {
  return team1.toLowerCase().includes('winner') || team1.toLowerCase().includes('loser') || team2.toLowerCase().includes('winner') || team2.toLowerCase().includes('loser');
}

/**
 * Parses events.
 */
export async function parseEvents() {
  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    try {
      const schedule = await getSchedule(sport);
      const parsedSchedule = [];
      for (const match of schedule) {
        const parsedDate = new Date(match.startDate).toISOString().split('T');

        const teams = [];
        const choices = [];
        let matchName = match.eventUnitName;

        if (match.competitors.length && match.competitors[0] && match.competitors[1]) {
          const team1 = match.competitors[0].name;
          const team2 = match.competitors[1].name;

          if (!includesWinnerOrLooser(team1, team2)) {
            teams.push(team1);
            teams.push(team2);
            matchName += ` - ${teams.join(' vs ')}`;

            choices.push({
              choice: teams[0],
              initialBet: 10
            });
            choices.push({
              choice: teams[1],
              initialBet: 10
            });

            if (canBeTied(sport, match.eventUnitName, teams)) {
              choices.push({
                choice: 'DRAW',
                initialBet: 10
              });
            }
          }
        }

        const gender = getGenderFromDescription(match.eventUnitName);
        const startTimeEpoch = new Date(dateToUtc(match.startDate)).getTime() / 1000;
        const endTimeEpoch = new Date(dateToUtc(match.endDate)).getTime() / 1000;
        const sportIndex = getSportIndex(sport);
        const genderIndex = getGenderByIndex(gender);
        const group = getGroup(match.eventUnitName);


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
          initialPool: process.env.BET_INITIAL_POOL || 60,
          winner: null,
          _externalId: match.id
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
 * Adds all parsed events to contract.
 */
export async function addEventsToContract() {
  const events = await SportEventModel.find({ uid: { $ne: null } });

  let idx = 0;
  while (idx !== events.length) {
    const event = events[idx]
    try {
      await addEvent(event.uid);
      idx++;
    } catch (error) {
      console.log(error);

      if (error.message.includes('nonce has already been used')) {
        console.log('Sleeping for 5 seconds...')
        await sleep(5000);
        continue;
      } else {
        break;
      }
    }
  }
}

/**
 * Worker handler.
 * @param {*} req Request.
 * @param {*} res Response.
 */
export default async function handler(req, res) {
  dotenv.config();
  await ConnectDB();

  try {
    await parseEvents();
    await addEventsToContract();

    res.send({ ok: true });
  } catch (error) {
    console.log(error);

    res.status(500).send({ ok: false, error });
  }
}
