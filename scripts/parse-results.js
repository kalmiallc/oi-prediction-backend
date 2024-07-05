import * as dotenv from "dotenv";
import ConnectDB from "../api/db.js";
import parseResults from "../api/result-parser.js";
dotenv.config();

(async () => {
  await ConnectDB();
  await parseResults();
  console.log("Winners updated!");
  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});


