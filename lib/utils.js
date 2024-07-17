import { Gender, Sports  } from './types.js';
import { ethers } from "ethers";

/**
 * Creates event UID.
 * @param {*} sportIndex 
 * @param {*} genderIndex 
 * @param {*} startTime 
 * @param {*} teams 
 * @returns 
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

