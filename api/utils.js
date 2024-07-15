
import  Sports  from './types.js';
import { Gender } from './types.js';
import { ethers } from "ethers";

/**
 * 
 * @param {*} sportIndex 
 * @param {*} genderIndex 
 * @param {*} startTime 
 * @param {*} teams 
 * @returns 
 */
export function createUid(sportIndex, genderIndex, startTime, teams) {
  try {
    const teamsString = teams.join(',');
    const itemsKeccak = ethers.solidityPackedKeccak256(
      ['uint32', 'uint8', 'uint256', 'string'],
      [ sportIndex, genderIndex, startTime, teamsString ]
    );

    return itemsKeccak;
  } catch (error) {
    console.log(error)

    throw error;
  }


}

/**
 * 
 * @param {*} sport 
 * @returns 
 */
export function getSportIndex(sport) {
  return Object.keys(Sports).indexOf(sport);
}

/**
 * 
 * @param {*} gender 
 * @returns 
 */
export function getGenderByIndex(gender) {
  return Object.keys(Gender).indexOf(gender);
}

