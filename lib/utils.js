import { ethers } from "ethers";
import { Gender, Sports } from './types.js';
import { VALID_TEAMS, EVENT_RESULTS_PROBABILITIES } from './data.js';


/**
 * Tells if given team is valid.
 * @param {*} team Team name.
 * @returns Boolean.
 */
export function isTeamValid(team) {
  return VALID_TEAMS.includes(team);
}

/**
 * Creates event UID.
 * @param {*} sportIndex Sport index.
 * @param {*} genderIndex Gender index.
 * @param {*} startTime Start time.
 * @param {*} teams Teams.
 * @returns event UID.
 */
export function createUid(sportIndex, genderIndex, startTime, teams) {
  try {
    const teamsString = teams.join(',');
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const itemsKeccak = ethers.keccak256(
      abiCoder.encode(
        ['uint32', 'uint8', 'uint256', 'string'],
        [ sportIndex, genderIndex, startTime, teamsString ]
      )
    );

    return itemsKeccak;
  } catch (error) {
    console.log(error)

    throw error;
  }
}

/**
 * Returns sport index.
 * @param {*} sport Sport.
 * @returns Sport index.
 */
export function getSportIndex(sport) {
  return Object.keys(Sports).indexOf(sport);
}

/**
 * Returns gender index.
 * @param {*} gender Gender.
 * @returns Gender index.
 */
export function getGenderByIndex(gender) {
  return Object.keys(Gender).indexOf(gender);
}

/**
 * 
 * @param {*} ms 
 * @returns 
 */
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 
 * @param {*} dateString 
 * @returns 
 */
export function dateToUtc(dateString) {
  const date = new Date(dateString);
  const utcDateTime = date.toISOString();

  return utcDateTime;
}

/**
 * Parses gender out of event description.
 * @param {*} eventString Event string.
 * @returns Parsed gender.
 */
export function getGenderFromDescription(eventString) {
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
 * Returns initial bets for specific match.
 * @param {*} sport Sport.
 * @param {*} team1 First team.
 * @param {*} team2 Second team.
 * @param {*} canBeTied If match can be tied.
 * @returns Initial bets.
 */
export function getInitialBets(sport, team1, team2, canBeTied) {
  const res = {};

  const pool = process.env.BET_INITIAL_POOL;
  const probabilities = EVENT_RESULTS_PROBABILITIES.find((d) => d.sport === sport && (d.team_a === team1 || d.team_b === team1) && (d.team_a === team2 || d.team_b === team2));
  if (!probabilities) {
    return null;
  }

  if (canBeTied) {
    let initialProb = probabilities.probability_draw;
    if (initialProb < 0.15) {
      probabilities.probability_draw = 0.15;

      const lowerProb = (probabilities.probability_draw - initialProb) / 2;
      probabilities.probability_a_wins = Math.max(0, probabilities.probability_a_wins - lowerProb);
      probabilities.probability_b_wins = Math.max(0, probabilities.probability_b_wins - lowerProb);
    }

    res['DRAW'] = parseInt(Math.ceil(probabilities.probability_draw * pool), 10);
  }
  
  if (team1 === probabilities.team_a) {
    res[team1] = parseInt(Math.ceil(probabilities.probability_a_wins * pool), 10);
    res[team2] = parseInt(Math.ceil(probabilities.probability_b_wins * pool), 10);
  } else {
    res[team1] = parseInt(Math.ceil(probabilities.probability_b_wins * pool), 10);
    res[team2] = parseInt(Math.ceil(probabilities.probability_a_wins * pool), 10);
  }

  return res;
}