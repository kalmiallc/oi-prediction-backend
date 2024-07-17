import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { requestAttestation } from "../lib/attestation.js";

dotenv.config();

(async () => {
  await ConnectDB();
  await requestAttestation("0x43042e862a4d246f6614903e1850cc6090134225581b099f256a9d7d161b6ac6");
})().catch(async (err) => {
  console.log(err);
});


