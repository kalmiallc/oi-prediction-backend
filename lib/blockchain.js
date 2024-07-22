import { ethers } from "ethers";
import SportEventModel from "./models.js";

/**
 * Sets up betting contract.
 * @returns Provider, signer and betting contract.
 */
export function setup() {
  const provider = new ethers.JsonRpcProvider(process.env.FLARE_RPC);
  const signer = new ethers.Wallet(process.env.ATTESTATION_PRIVATE_KEY, provider);

  const bettingContract = new ethers.Contract(
    process.env.OI_BETTING_CONTRACT,
    [
      'function createSportEvent(string title, string memory teams, uint256 startTime, uint8 gender, uint8 sport, string[] choices, uint32[] initialVotes, uint256 initialPool, bytes32 _uid) payable',
      'function sportEvents(bytes32) view returns (bytes32 uid, string title, uint256 startTime, uint8 sport, uint256 poolAmount, uint16 winner, uint8 gender, bool cancelled)',
      'function cancelSportEvent(bytes32 _uid)',
      'function bulkCreateSportEvent(string[] title, string[] teams, uint256[] startTime, uint8[] gender, uint8[] sport, string[][] choices, uint32[][] initialVotes, uint256[] initialPool, bytes32[] _uid) payable',  
    ],
    signer
  );

  return { provider, signer, bettingContract };
}

/**
 * Adds sport event in bulk.
 * @param {*} events Array of sport events.
 */
export async function addEventBulk(events) {
  const matches = [];
  const teams = [];
  const startTimes = [];
  const genders = [];
  const sports = [];
  const choices = [];
  const initialBets = [];
  const initialPools = [];
  const uids = [];
  let poolValue = ethers.parseUnits("0", "ether");

  for (const event of events) {
    const eventChoices = event.choices.map(x => x.choice);
    const eventInitialBets = event.choices.map(x => x.initialBet);
    const initialPool = ethers.parseUnits(event.initialPool.toString(), "ether");

    matches.push(event.match);
    teams.push(event.teams.join(","));
    startTimes.push(event.startTime);
    genders.push(event.genderByIndex);
    sports.push(event.sportByIndex);
    choices.push(eventChoices);
    initialBets.push(eventInitialBets);
    initialPools.push(initialPool);
    uids.push(event.uid);

    poolValue += initialPool;
  }

  const { bettingContract } = setup();
  try {
    const tx = await bettingContract.bulkCreateSportEvent(
      matches,
      teams,
      startTimes,
      genders,
      sports,
      choices,
      initialBets,
      initialPools,
      uids,
      { value: poolValue }
    );
  
    await tx.wait();
    await SportEventModel.updateMany({ uid : { $in : uids } }, { txHash: tx.hash })

    console.log(tx.hash);
  } catch (error) {
    console.log(error);

    throw error;
  }

}

/**
 * Adds event to contract.
 * @param {*} uid UID of the event.
 */
export async function addEvent(uid) {
  const event = await SportEventModel.findOne({ uid });
  if (!event) {
    throw new Error('Event does not exits!')
  }

  const { bettingContract } = setup();
  const contractEvent = await bettingContract.sportEvents(uid);
  if (contractEvent.uid !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.log('Event already exists.')
    return;
  }

  const choices = event.choices.map(x => x.choice);
  const initialBets = event.choices.map(x => x.initialBet);
  const initialPool = ethers.parseUnits(event.initialPool.toString(), "ether");
  try {
    const tx = await bettingContract.createSportEvent(
      event.match,
      event.teams.join(","),
      event.startTime,
      event.genderByIndex,
      event.sportByIndex,
      choices,
      initialBets,
      initialPool,
      event.uid,
      { value: initialPool }
    );
  
    await tx.wait();

    event.txHash = tx.hash;
    await event.save();

    console.log(tx.hash);
  } catch (error) {
    console.log(error);

    throw error;
  }
}

/**
 * Cancels event on contract.
 * @param {*} uid UID of the event.
 */
export async function cancelEvent(uid) {
  const event = await SportEventModel.find({ uid });
  if (!event) {
    throw new Error('Event does not exits!')
  }

  const { bettingContract } = setup();
  const contractEvent = await bettingContract.sportEvents(uid);
  if (contractEvent.uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    throw new Error('Event does not exits on contract!')
  }

  try {
    const tx = await bettingContract.cancelSportEvent(uid);
    await tx.wait();
  } catch (error) {
    console.log(error);

    throw error;
  }
}