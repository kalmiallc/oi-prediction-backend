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
      'function cancelSportEvent(bytes32 _uid)'
    ],
    signer
  );

  return { provider, signer, bettingContract };
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