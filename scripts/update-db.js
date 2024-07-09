import * as dotenv from "dotenv";

import jsonData from "../eventData.json" assert { type: "json" };
import SportEventModel from "./../api/models.js";
import ConnectDB from "../api/db.js";
import { createUid } from "../api/utils.js";
dotenv.config();

(async () => {
  await ConnectDB();
  await SportEventModel.deleteMany({});
  const updateData = convertAndAddTimes(jsonData);
  await SportEventModel.insertMany(updateData);
  console.log("Data imported successfully!");
  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});

function convertAndAddTimes(data) {
  return data.map((event) => {
    const startTimeEpoch = new Date(event.startTime).getTime() / 1000; // Convert startTime to Unix epoch
    const uuid = createUid(event.sport, event.match, event.startTime);
    console.log(`Adding event for: ${event.match}`);


    return {
      ...event,
      startTime: startTimeEpoch,
      uid,
    };
  });
}
