


import dotenv from 'dotenv';
import { addEvent } from '../../lib/blockchain.js';
import ConnectDB from "../../lib/db.js";
import { PARSE_SPORTS } from "../../lib/events-scrapping.js";
import SportEventModel from "../../lib/models.js";
import { getSchedule } from '../../lib/olympics-api.js';
import { sendSlackWebhook } from '../../lib/slack-webhook.js';
import { Sports } from "../../lib/types.js";
import { createUid, dateToUtc, includesWinnerOrLooser } from "../../lib/utils.js";

/**
 * Updates events.
 */
export async function updateEvents() {
  const sports = Object.keys(Sports).filter(key => PARSE_SPORTS.includes(Sports[key]));
  for (const sport of sports) {
    const events = await SportEventModel.find({ uid: null, sport: Sports[sport] });
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
        Error while schedule data for sport. Please check if API still works: \n
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
        continue;
      }

      const teams = [];
      const choices = [];
      let matchName = scheduledEvent.eventUnitName;

      if (scheduledEvent.competitors.length && scheduledEvent.competitors[0] && scheduledEvent.competitors[1]) {
        const team1 = scheduledEvent.competitors[0].name;
        const team2 = scheduledEvent.competitors[1].name;

        if (!includesWinnerOrLooser(team1, team2)) {
          teams.push(team1);
          teams.push(team2);
          matchName += ` - ${teams.join(' vs ')}`;

          choices.push({
            choice: teams[0],
            initialBet: 10
          });
          choices.push({
            choice: teams[1],
            initialBet: 10
          });

          const parsedDate = new Date(scheduledEvent.startDate).toISOString().split('T');
          const startTimeEpoch = new Date(dateToUtc(scheduledEvent.startDate)).getTime() / 1000;
          const endTimeEpoch = new Date(dateToUtc(scheduledEvent.endDate)).getTime() / 1000;

          const uid = createUid(event.sportByIndex, event.genderByIndex, startTimeEpoch, teams);
          if (uid) {
            event.uid = uid;
            event.teams = teams;
            event.choices = choices;
            event.match = matchName;
            event.startTime = startTimeEpoch;
            event.endTime = endTimeEpoch;
            event.date = parsedDate[0];
            event.time = parsedDate[1].substring(0,5);
            await event.save();

            try {
              await addEvent(event.uid);
            } catch (error) {
              await sendSlackWebhook(
                `
                Error while adding updated event to contract. Event is saved in database: \n
                - UID: \`${event.uid}\`\n
                - ID: \`${event.id}\`\n
                - Error: \`${error.message}\`\n
                `,
                true
              );
            }

            console.log('Event updated: ', event._externalId);
          }
        } else {
          console.log('Event not updated: ', event._externalId);
        }
      } else {
        console.log('Event not updated: ', event._externalId);
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