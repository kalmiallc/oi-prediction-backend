import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { parseEvents, addEventsToContractBulk } from "../api/workers/parse-events.worker.js";

dotenv.config();

(async () => {
  await ConnectDB();
  // await parseEvents();
  await addEventsToContractBulk();

  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});
