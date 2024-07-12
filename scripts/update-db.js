import * as dotenv from "dotenv";

import jsonData from "../eventData.json" assert { type: "json" };
import SportEventModel from "./../api/models.js";
import ConnectDB from "../api/db.js";
import { createUid, getGenderByIndex } from "../api/utils.js";
import { getSportIndex } from "../api/utils.js";
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
    const sportIndex = getSportIndex(event.sport);
    const genderIndex = getGenderByIndex(event.gender);
    const uid = createUid(sportIndex, genderIndex, startTimeEpoch, event.teams);
    console.log(`Adding event for: ${event.match}`);

    return {
      ...event,
      genderByIndex: genderIndex,
      sportByIndex: sportIndex,
      startTime: startTimeEpoch,
      uid,
    };
  });
}
