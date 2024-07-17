import * as dotenv from "dotenv";
import ConnectDB from "../api/db.js";
import { updateEventsResults } from "../api/workers/update-events-results.worker.js";
dotenv.config();

(async () => {
  await ConnectDB();
  await updateEventsResults();

  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});




