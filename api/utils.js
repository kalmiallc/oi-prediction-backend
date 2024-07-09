import crypto from 'crypto';

export function createUid(sport, title, startTime) {
  const sportIndex = Object.keys(Sports).indexOf(sport);
  console.log("Sport index for: ", sport, sportIndex);

  const itemsKeccak = ethers.solidityPackedKeccak256(
    ['string', 'uint256', 'uint8'],
    [title, startTime, sportIndex]
  );
  return itemsKeccak;
}

