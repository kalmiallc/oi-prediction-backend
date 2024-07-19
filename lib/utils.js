import { ethers } from "ethers";
import { Gender, Sports } from './types.js';

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
 * 
 * @param {*} team1 
 * @param {*} team2 
 * @returns 
 */
export function includesWinnerOrLooser(team1, team2) {
  return team1.toLowerCase().includes('winner') || team1.toLowerCase().includes('loser') || team2.toLowerCase().includes('winner') || team2.toLowerCase().includes('loser');
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