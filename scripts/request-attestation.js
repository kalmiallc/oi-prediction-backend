import * as dotenv from "dotenv";
import { requestAttestation } from "../api/attestation.js";
dotenv.config();

(async () => {
  requestAttestation(
    "0x43042e862a4d246f6614903e1850cc6090134225581b099f256a9d7d161b6ac6", // uid
    1, // sport
    0, // gender
    1722038400, // timestamp
    "Slovenia,France"
  );
})().catch(async (err) => {
  console.log(err);
});


