async function requestAttestation(uid, sport, gender, date, teams) {
  const [
    ATTESTATION_PROVIDER_URL,
    ATTESTATION_PROVIDER_API_KEY,
    ethers,
    flare,
    utils,
    provider,
    signer,
    stateConnector
  ] = setup();

  const VERIFICATION_ENDPOINT =
    `${ATTESTATION_PROVIDER_URL}/verifier/${network.toLowerCase()}` +
    `/MatchResult/prepareRequest`;

  // 1. Prepare Attestation Request
  const { encodeAttestationName } = utils;
  const rawAttestationRequest = {
    attestationType: encodeAttestationName("MatchResult"),
    sourceId: encodeAttestationName(`testMatchResult`),
    requestBody: {
      sport, 
      gender, 
      date, 
      teams
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
    return;
  }
  console.log(
    "Received encoded attestation request:",
    encodedAttestationRequest.abiEncodedRequest
  );

  // 5. Request Attestation from the State Connector Contract
  console.log("Submitting attestation to State Connector...");
  const attestationTx = await stateConnector.requestAttestations(
    encodedAttestationRequest.abiEncodedRequest
  );
  const receipt = await attestationTx.wait();
  const block = await provider.getBlock(receipt.blockNumber);

  // 6. Calculate Round ID
  const roundOffset = await stateConnector.BUFFER_TIMESTAMP_OFFSET();
  const roundDuration = await stateConnector.BUFFER_WINDOW();
  const submissionRoundID = Number(
    (BigInt(block.timestamp) - roundOffset) / roundDuration
  );

  // save encodedAttestationRequest to DB
  // save attestation submit time to DB
  // save roundOffset to DB
  // save roundDuration to DB
  // save submissionRoundID to DB

  console.log("Attestation submitted in round", submissionRoundID);
}

async function getAttestationResult(uid) {
  const [
    ATTESTATION_PROVIDER_URL,
    ATTESTATION_PROVIDER_API_KEY,
    ethers,
    flare,
    utils,
    provider,
    signer,
    stateConnector
  ] = setup();

  // Load encodedAttestationRequest from DB
  // Load submissionRoundID from DB
  const encodedAttestationRequest = {};
  const submissionRoundID = 0;

  const lastFinalizedRoundID = Number(
    await stateConnector.lastFinalizedRoundId()
  );
  if (lastFinalizedRoundID < submissionRoundID) {
    console.log("submissionRoundID not finalized", lastFinalizedRoundID);
    return;
  }

  // Retrieve Proof
  const proofRequest = {
    roundId: submissionRoundID,
    requestBytes: encodedAttestationRequest.abiEncodedRequest,
  };

  console.log("Retrieving proof from attestation provider...");
  const providerResponse = await fetch(ATTESTATION_ENDPOINT, {
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
    return;
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

  const { isValid } = fullProof.data.responseBody;

  console.log("Sending the proof for verification...");
  const matchResultVerifier = new ethers.Contract(
    flare.nameToAddress("IMatchResultVerification", "coston"),
    flare.nameToAbi("IMatchResultVerification", "coston").data,
    signer
  );
  const isVerified =
    await matchResultVerifier.verifyMatchResult(fullProof);
  console.log("  Attestation result:", isVerified);

  // Check if match result is valid
  if (isVerified) {
    console.log(
      isValid
        ? "Attestation providers agree that the address is valid."
        : "Attestation providers agree that the address is invalid."
    );
  } else {
    console.log(
      "Could not verify attestation. Validity of address is unknown."
    );
  }

  // Save fullProof to DB
  // Perform finalizeMatch call to betting contract to set winner
  // Perform finalizeMatch call to betting contract to set winner
  // Perform finalizeMatch call to betting contract to set winner
}

async function setup() {
  const FLARE_CONTRACTS = "@flarenetwork/flare-periphery-contract-artifacts";
  const FLARE_RPC = ""; // load from env
  const ATTESTATION_PROVIDER_URL = ""; // load from env
  const ATTESTATION_PROVIDER_API_KEY = ""; // load from env
  const FLARE_CONTRACT_REGISTRY_ADDR = ""; // load from env
  const PRIVATE_KEY = ""; // load from env

  // Set up
  const ethers = await import("ethers");
  const flare = await import(FLARE_CONTRACTS);
  const utils = await import(
    `${FLARE_CONTRACTS}/dist/coston/StateConnector/libs/ts/utils.js`
  );
  const provider = new ethers.JsonRpcProvider(FLARE_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  // Access Contract Registry
  const flareContractRegistry = new ethers.Contract(
    FLARE_CONTRACT_REGISTRY_ADDR,
    flare.nameToAbi("FlareContractRegistry", "coston").data,
    provider
  );

  // Retrieve the State Connector Contract Address
  const stateConnectorAddress =
    await flareContractRegistry.getContractAddressByName("StateConnector");
  const stateConnector = new ethers.Contract(
    stateConnectorAddress,
    flare.nameToAbi("StateConnector", "coston").data,
    signer
  );

  return [
    ATTESTATION_PROVIDER_URL,
    ATTESTATION_PROVIDER_API_KEY,
    ethers,
    flare,
    utils,
    provider,
    signer,
    stateConnector
  ]
}

export { requestAttestation, getAttestationResult };