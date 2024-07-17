


import SportEventModel from "../models.js";
import { EVENTS_URL, getBuildId, PARSE_SPORTS, UrlSportEncoding } from "../events-scrapping.js";
import Sports from "../types.js";
import { createUid } from "../utils.js";
import { getJson } from "serpapi";




/**
 * Update results after this period of hours.
 */
const END_PERIOD_HOURS = 2;

/**
 * Updates events results.
 */
export async function updateEventsResults() {
  try {
    // const endPeriodAgoInSeconds = Math.floor(Date.now() / 1000) - END_PERIOD_HOURS * 60 * 60;
    // const events = await SportEventModel.find({ endTime: { $lte: endPeriodAgoInSeconds }, uid: { $ne: null } });
    // if (!events.length) {
    //   console.log('No events found.')
    //   return;
    // }

    // for (const event of events) {
      const response = await getJson({
        engine: "google",
        api_key: process.env.SERPAPI_API_KEY,
        q: "Slovenia vs England euro 2024"
      });

      console.log(JSON.stringify(response.sports_results, null, 2))
    // }




  } catch(error) {
    console.log('Error while updating event results: ')
    console.log(error);
  }
}

/**
 * Worker handler.
 * @param {*} req Request.
 * @param {*} res Response.
 */
export default function handler(req, res) {
  updateEventsResults()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}