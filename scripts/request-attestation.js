import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { requestAttestation } from "../lib/attestation.js";
import { requestAttestations } from "../api/workers/request-attestation.worker.js";

dotenv.config();

(async () => {
  await ConnectDB();
  // await requestAttestation("0x43042e862a4d246f6614903e1850cc6090134225581b099f256a9d7d161b6ac6");
  await requestAttestations();
})().catch(async (err) => {
  console.log(err);
});


