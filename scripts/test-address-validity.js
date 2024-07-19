import * as dotenv from "dotenv";
import runAddressValidity from "../lib/address-validity.js";

dotenv.config();

(async () => {
  runAddressValidity(
    "btc",
    "tb1p4mdyx3dvgk4dhvv8yv2dtuymf00wxhgkkjheqm7526fu7znnd6msw3qxvj"
  );
  
  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});


