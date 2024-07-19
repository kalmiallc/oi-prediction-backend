import * as dotenv from "dotenv";
import { Sports } from "../lib/types.js";
import { getSchedule } from "../lib/olympics-api.js";
import { PARSE_SPORTS } from "../lib/events-scrapping.js";

dotenv.config();

(async () => {
  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  const teams = new Set();

  for (const sport of sports) {
    try {
      const schedule = await getSchedule(sport);

      for (const match of schedule) {
        if (match.competitors.length && match.competitors[0] && match.competitors[1]) {
          teams.add(match.competitors[0].name);
          teams.add(match.competitors[1].name);
        }
      }
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  console.log(JSON.stringify(Array.from(teams), null, 2));

  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});




