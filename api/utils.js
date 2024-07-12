
import  Sports  from './types.js';
import { Gender } from './types.js';
import { ethers } from "ethers";

export function createUid(sportIndex, genderIndex, startTime, teams) {
    const teamsString = teams.join(';');
    const itemsKeccak = ethers.solidityPackedKeccak256(
    ['uint32', 'uint8', 'uint256', 'string'],
    [ sportIndex, genderIndex, startTime, teamsString ]
  );
  console.log(`Creating UID for ${teamsString} with sportIndex ${sportIndex}, genderIndex ${genderIndex}, startTime ${startTime}`, itemsKeccak);
  return itemsKeccak;
}

export function getSportIndex(sport) {
  return Object.keys(Sports).indexOf(sport);
}

export function getGenderByIndex(gender) {
  return Object.keys(Gender).indexOf(gender);
}

