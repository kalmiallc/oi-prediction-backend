import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { updateAllEvents } from "../api/workers/update-all-events.worker.js";

dotenv.config();

(async () => {
  await ConnectDB();
  await updateAllEvents();

  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});




