import * as dotenv from "dotenv";
import { Sports } from "../lib/types.js";
import { getSchedule } from "../lib/olympics-api.js";
import { PARSE_SPORTS } from "../lib/events-scrapping.js";
import { isTeamValid } from "../lib/utils.js";

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

  const parsedTeams = Array.from(teams);
  console.log(JSON.stringify(parsedTeams, null, 2));

  for (const team of parsedTeams) {
    if (!isTeamValid(team)) {
      console.log('Invalid team: ', team);
    }
  }



  process.exit(0);
})().catch(async (err) => {
  console.log(err);
  process.exit(1);
});




