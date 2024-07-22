import * as dotenv from "dotenv";
// import { getAttestationResult } from "../lib/attestation.js";
import { getEventAttestationResults } from "../api/workers/get-attestation-results.worker.js"
import ConnectDB from "../lib/db.js";


dotenv.config();

(async () => {
  await ConnectDB();
  // getAttestationResult(
  //   "0x43042e862a4d246f6614903e1850cc6090134225581b099f256a9d7d161b6ac6", // uid
  // );

  await getEventAttestationResults();

  process.exit(0);
})().catch(async (error) => {
  console.log(error);
  process.exit(1);
});


