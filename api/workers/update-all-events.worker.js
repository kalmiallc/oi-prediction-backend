


import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import { PARSE_SPORTS } from "../../lib/events-scrapping.js";
import SportEventModel from "../../lib/models.js";
import { getSchedule } from '../../lib/olympics-api.js';
import { sendSlackWebhook } from '../../lib/slack-webhook.js';
import { Sports } from "../../lib/types.js";
import { createUid, dateToUtc, getGenderByIndex, getGenderFromDescription } from "../../lib/utils.js";
import { addEvent, cancelEvent } from '../../lib/blockchain.js';
import { parseEvent } from './parse-events.worker.js';

/**
 * Checks if event is canceled.
 * @param {*} scheduledEvent API event.
 * @param {*} event Existing event.
 * @returns Boolean.
 */
function isEventChanged(scheduledEvent, event) {
  const startTimeEpoch = new Date(dateToUtc(scheduledEvent.startDate)).getTime() / 1000;
  const endTimeEpoch = new Date(dateToUtc(scheduledEvent.endDate)).getTime() / 1000;

  if (startTimeEpoch !== event.startTime || endTimeEpoch !== event.endTime) {
    return true;
  }

  let teams = [];
  if (scheduledEvent.competitors.length && scheduledEvent.competitors[0] && scheduledEvent.competitors[1]) {
    teams = [scheduledEvent.competitors[0].name, scheduledEvent.competitors[1].name];

    if (teams.join(',') !== event.teams.join(',')) {
      return true;
    }
  }

  const gender = getGenderFromDescription(match.eventUnitName);
  const genderIndex = getGenderByIndex(gender);
  if (genderIndex !== event.genderByIndex) {
    return true;
  }

  if (event.uid) {
    const uid = createUid(event.sportByIndex, genderIndex, startTimeEpoch, teams);
    if (event.uid !== uid) {
      return true;
    }
  }

  return false;
}

/**
 * Updates events.
 */
export async function updateAllEvents() {
  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    const events = await SportEventModel.find({
      uid: { $ne: null },
      winner: null,
      sport: Sports[sport],
      canceled: false
    });
    
    if (!events.length) {
      continue;
    }

    let schedule = [];
    try {
      schedule = await getSchedule(sport);
    } catch (error) {
      console.log(error);

      await sendSlackWebhook(
        `
        Error while getting schedule data for sport. Please check if API still works: \n
        - Sport: \`${sport}\`\n
        - Error: \`${error.message}\`\n
        `,
        true
      );

      continue;
    }

    if (!schedule.length) {
      console.log('No schedule found for select sport: ' + sport);
      continue;
    }

    for (const event of events) {
      const scheduledEvent = schedule.find((s) => s.id === event._externalId);
      if (!scheduledEvent) {
        console.log('Event not found: ' + event.id);

        await sendSlackWebhook(
          `
          Scrapped event not matched to any event in database: \n
          - Event: ${JSON.stringify(scheduledEvent, null, w)}\n
          `,
          true
        );

        continue;
      }

      if (isEventChanged(scheduledEvent, event)) {
        try {
          // Cancel existing event.
          event.canceled = true;
          await event.save();
          if (event.uid && event.txHash) {
            await cancelEvent(event.uid);
          }

          // Add new event.
          const parsedEvent = parseEvent(scheduledEvent, sport)
          const newEvent = await SportEventModel.create(parsedEvent);
          if (parsedEvent.uid) {
            await addEvent(parsedEvent.uid);
          }

          await sendSlackWebhook(
            `
            Handled event change: \n
            - Canceled event UID: \`${event.uid}\`\n
            - Canceled event database ID: \`${event.id}\`\n
            - New event UID:  \`${newEvent.uid}\`\n
            - New event database ID: \`${newEvent.id}\`\n
            `,
            true
          );

        } catch (error) {
          await sendSlackWebhook(
            `
            Error while handling changed event: \n
            - Changed event UID: \`${event.uid}\`\n
            - Changed event database ID: \`${event.id}\`\n
            - New event: ${JSON.stringify(scheduledEvent, null, 2)}\n
            - Error: \`${error.message}\`\n
            `,
            true
          );
        }
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

  updateAllEvents()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}