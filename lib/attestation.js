import SportEventModel from "./models.js";

/**
 * Requests attestation.
 * @param {*} uid Event UID.
 */
async function requestAttestation(uid) {
  if (!uid) {
    throw new Error('No UID provided!')
  }

  const {
    ATTESTATION_PROVIDER_URL,
    ATTESTATION_PROVIDER_API_KEY,
    utils,
    provider,
    stateConnector,
   } = await setup();

  const event = await SportEventModel.findOne({ uid });
  if (!event || !event.id) {
    throw new Error('Desired event does not exits!')
  }

  // Prepare Attestation Request
  const VERIFICATION_ENDPOINT = `${ATTESTATION_PROVIDER_URL}/verifier/MatchResult/prepareRequest`;
  const { encodeAttestationName } = utils;
  const rawAttestationRequest = {
    attestationType: encodeAttestationName("MatchResult"),
    sourceId: encodeAttestationName("WEB"),
    requestBody: {
      sport: event.sportByIndex.toString(),
      gender: event.genderByIndex.toString(),
      date:  event.startTime.toString(),
      teams: event.teams.join(',')
    },
  };

  console.log(
    "Preparing attestation request using verifier",
    ATTESTATION_PROVIDER_URL,
    "..."
  );
  console.log("Request:", rawAttestationRequest);

  const verifierResponse = await fetch(VERIFICATION_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": ATTESTATION_PROVIDER_API_KEY,
    },
    body: JSON.stringify(rawAttestationRequest),
  });

  const encodedAttestationRequest = await verifierResponse.json();
  if (encodedAttestationRequest.status !== "VALID") {
    console.log("Received error:", encodedAttestationRequest);

    throw new Error('Attestation request error: ' + JSON.stringify(encodedAttestationRequest, null, 2))
  }

  console.log(
    "Received encoded attestation request:",
    encodedAttestationRequest.abiEncodedRequest
  );

  // Request Attestation from the State Connector Contract
  console.log("Submitting attestation to State Connector...");
  const attestationTx = await stateConnector.requestAttestations(
    encodedAttestationRequest.abiEncodedRequest
  );
  const receipt = await attestationTx.wait();
  const block = await provider.getBlock(receipt.blockNumber);

  // Calculate Round ID
  const roundOffset = await stateConnector.BUFFER_TIMESTAMP_OFFSET();
  const roundDuration = await stateConnector.BUFFER_WINDOW();
  const submissionRoundID = ((BigInt(block.timestamp) - roundOffset) / roundDuration).toString()
  if (!encodedAttestationRequest || !roundOffset || !roundDuration || !submissionRoundID) {
    throw new Error('Incomplete attestation data!')
  }

  event.attestationData.encodedAttestationRequest = encodedAttestationRequest;
  event.attestationData.attestationSubmitTime =  Math.floor(Date.now() / 1000);
  event.attestationData.roundOffset = roundOffset;
  event.attestationData.roundDuration = roundDuration;
  event.attestationData.submissionRoundID = submissionRoundID;
  await event.save();

  console.log("Attestation submitted in round: ", submissionRoundID);
}

/**
 * Obtains attestations results.
 * @param {*} uid Event UID.
 */
async function getAttestationResult(uid) {
  if (!uid) {
    throw new Error('No UID provided!')
  }

  const {
    ATTESTATION_PROVIDER_API_KEY,
    ATTESTATION_PROOF_ENDPOINT,
    ethers,
    signer,
    stateConnector
 } = await setup();

  const event = await SportEventModel.findOne({ uid });
  if (!event || !event.id) {
    throw new Error('Desired event does not exits!')
  }

  const encodedAttestationRequest = event.attestationData.encodedAttestationRequest;
  const submissionRoundID = event.attestationData.submissionRoundID;

  const lastFinalizedRoundID = Number(
    await stateConnector.lastFinalizedRoundId()
  );
  if (lastFinalizedRoundID < submissionRoundID) {
    console.log("Submission round ID is not yet finalized: ", lastFinalizedRoundID);
    return;
  }

  // Retrieve Proof
  const proofRequest = {
    roundId: Number(submissionRoundID),
    requestBytes: encodedAttestationRequest.abiEncodedRequest,
  };

  console.log("Retrieving proof from attestation provider...");
  const providerResponse = await fetch(ATTESTATION_PROOF_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": ATTESTATION_PROVIDER_API_KEY,
    },
    body: JSON.stringify(proofRequest),
  });

  const proof = await providerResponse.json();
  if (proof.status !== "OK") {
    console.log("Received error:", proof);

    throw new Error('Received proof error: ' + JSON.stringify(proof, null, 2))
  }
  console.log("Received Merkle proof:", proof.data.merkleProof);

  // Send Proof to Verifier Contract
  // Unpacked attestation proof to be used in a Solidity contract.
  const fullProof = {
      merkleProof: proof.data.merkleProof,
      data: {
          ...proof.data,
          ...proof.data.request,
          ...proof.data.response,
          status: proof.status,
      }
  };
  
  const isValid = ["1", "2", "3"].includes(fullProof?.data?.responseBody?.result || '') && event.startTime === Number(fullProof?.data?.responseBody?.timestamp || '');
  console.log("Request body is valid: ", isValid);

  if (isValid) {
    const matchResultVerifier = new ethers.Contract(
      process.env.MATCH_RESULT_VERIFICATION,
      ['function verifyMatchResult((bytes32[] merkleProof, (bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, (uint256 date, uint32 sport, uint8 gender, string teams) requestBody, (uint256 timestamp, uint8 result) responseBody) data) _proof) view returns (bool _proved)',],
      signer
    );
    const isVerified = await matchResultVerifier.verifyMatchResult(fullProof);
    console.log("Match results verified: ", isVerified);

    if (isVerified) {
      // Perform finalizeMatch call to betting contract to set winner
      const bettingContract = new ethers.Contract(
        process.env.OI_BETTING_CONTRACT,
        ['function finalizeMatch((bytes32[] merkleProof, (bytes32 attestationType, bytes32 sourceId, uint64 votingRound, uint64 lowestUsedTimestamp, (uint256 date, uint32 sport, uint8 gender, string teams) requestBody, (uint256 timestamp, uint8 result) responseBody) data) proof)'],
        signer
      );

      await bettingContract.finalizeMatch(fullProof);

      // Save fullProof to DB
      event.attestationData.fullProof = fullProof;
      await event.save();
    } else {
      console.log("Match results are not verified.")
    }
  }
}

/**
 * Attestation setup function.
 */
async function setup() {
  const FLARE_CONTRACTS = "@flarenetwork/flare-periphery-contract-artifacts";
  const FLARE_RPC = process.env.FLARE_RPC;
  const ATTESTATION_PROVIDER_URL = process.env.ATTESTATION_PROVIDER_URL;
  const ATTESTATION_PROVIDER_API_KEY = process.env.ATTESTATION_PROVIDER_API_KEY;
  const FLARE_CONTRACT_REGISTRY_ADDR = process.env.FLARE_CONTRACT_REGISTRY_ADDR;
  const ATTESTATION_PRIVATE_KEY = process.env.ATTESTATION_PRIVATE_KEY;
  const ATTESTATION_PROOF_ENDPOINT = process.env.ATTESTATION_PROOF_ENDPOINT;


  // Set up.
  const ethers = await import("ethers");
  const flare = await import(FLARE_CONTRACTS);
  const utils = await import(
    `${FLARE_CONTRACTS}/dist/coston/StateConnector/libs/ts/utils.js`
  );
  const provider = new ethers.JsonRpcProvider(FLARE_RPC);
  const signer = new ethers.Wallet(ATTESTATION_PRIVATE_KEY, provider);

  // Access Contract Registry.
  const flareContractRegistry = new ethers.Contract(
    FLARE_CONTRACT_REGISTRY_ADDR,
    flare.nameToAbi("FlareContractRegistry", "coston").data,
    provider
  );

  // Retrieve the State Connector Contract Address.
  const stateConnectorAddress =
    await flareContractRegistry.getContractAddressByName("StateConnector");
  const stateConnector = new ethers.Contract(
    stateConnectorAddress,
    flare.nameToAbi("StateConnector", "coston").data,
    signer
  );

  return {
    ATTESTATION_PROVIDER_URL,
    ATTESTATION_PROVIDER_API_KEY,
    ATTESTATION_PROOF_ENDPOINT,
    ethers,
    flare,
    utils,
    provider,
    signer,
    stateConnector, 
  };
}

export { requestAttestation, getAttestationResult };