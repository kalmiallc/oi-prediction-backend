import * as dotenv from "dotenv";
import ConnectDB from "../lib/db.js";
import { updateEvents } from "../api/workers/update-events.worker.js";
dotenv.config();

(async () => {
  await ConnectDB();
  await updateEvents();

  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});




