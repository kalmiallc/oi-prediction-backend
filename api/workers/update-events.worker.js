


import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import { EVENTS_URL, getBuildId, PARSE_SPORTS, UrlSportEncoding } from "../../lib/events-scrapping.js";
import SportEventModel from "../../lib/models.js";
import Sports from "../../lib/types.js";
import { createUid } from "../../lib/utils.js";

/**
 * Updates events.
 */
export async function updateEvents() {
  const buildId = await getBuildId();
  if (!buildId) {
    throw new Error('No build ID found.')
  }

  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    const events = await SportEventModel.find({ uid: null, sport: Sports[sport] });
    if (!events.length) {
      continue;
    }


    const sportEncoding = UrlSportEncoding[sport];
    const url = EVENTS_URL(sportEncoding, buildId)
    let schedule = [];
    try {
      let res = await fetch(url);
      res = await res.json();

      const scheduleWrapper = res.pageProps.page.items.find(i => i.name === 'scheduleWrapper');
      if (scheduleWrapper) {
        const units = scheduleWrapper.data.schedules;

        for (const unit of units) {
          schedule = [...schedule, ...unit.units];
        }
      }
    } catch (error) {
      console.log(error);
      continue;
    }

    if (!schedule.length) {
      console.log('No schedule found for select sport: ' + sport);
      continue;
    }

    for (const event of events) {
      const scheduledEvent = schedule.find((s) => s.unitCode === event._externalId);
      if (!scheduledEvent) {
        console.log('Event not found: ' + event.id);
        continue;
      }

      const teams = [];
      const choices = [];
      let matchName = scheduledEvent.description;

      if (scheduledEvent.match?.team1 && scheduledEvent.match?.team2) {
        teams.push(scheduledEvent.match.team1.description);
        teams.push(scheduledEvent.match.team2.description);
        matchName += ` - ${teams.join(' vs ')}`;

        choices.push({
          choice: teams[0],
          initialBet: 10
        });
        choices.push({
          choice: teams[1],
          initialBet: 10
        });

        const uid = createUid(event.sportByIndex, event.genderByIndex, event.startTimeEpoch, teams);
        if (uid) {
          event.uid = uid;
          event.teams = teams;
          event.choices = choices;

          await event.save();
        }
      } else {
        console.log('Event not updated.')
      }
    }
  }
}

/**
 * Worker handler.
 * @param {*} req Request.
 * @param {*} res Response.
 */
export default async function handler(req, res) {
  dotenv.config();
  await ConnectDB();

  updateEvents()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}