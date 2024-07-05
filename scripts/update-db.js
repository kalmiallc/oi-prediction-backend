import * as dotenv from "dotenv";

import jsonData from "../eventData.json" assert { type: "json" };
import SportEventModel from "./../api/models.js";
import ConnectDB from "../api/db.js";
import { generateUUID } from "../api/utils.js";
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
    const endTime = new Date(startTimeEpoch * 1000 + 2 * 60 * 60 * 1000); // Add 2 hours to startTime for endTime
    const endTimeEpoch = endTime.getTime() / 1000; // Convert endTime to Unix epoch
    const uuid = generateUUID(event.match, event.startTime);
    console.log(`Adding event for: ${event.match}`);


    return {
      ...event,
      startTime: startTimeEpoch,
      endTime: endTimeEpoch,
      uuid,
    };
  });
}
