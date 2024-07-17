import * as dotenv from "dotenv";
import { getAttestationResult } from "../lib/attestation.js";
dotenv.config();

(async () => {
  getAttestationResult(
    "0x43042e862a4d246f6614903e1850cc6090134225581b099f256a9d7d161b6ac6", // uid
  );
})().catch(async (err) => {
  console.log(err);
});


