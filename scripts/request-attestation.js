import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { requestEventAttestations } from "../api/workers/request-attestation.worker.js";

dotenv.config();

(async () => {
  await ConnectDB();
  await requestEventAttestations();
  process.exit(0);
})().catch(async (error) => {
  console.log(error);
  process.exit(1);
});


