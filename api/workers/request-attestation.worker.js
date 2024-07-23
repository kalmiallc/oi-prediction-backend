import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import SportEventModel from "../../lib/models.js";
import { sendSlackWebhook } from '../../lib/slack-webhook.js';
import { requestAttestation } from '../../lib/attestation.js';

/**
 * Request event attestation after this period of hours.
 */
const END_PERIOD_HOURS = 2;

/**
 * Request events attestation.
 */
export async function requestEventAttestations() {
  const events = await SportEventModel.find({
    endTime: {
      $lte: Math.floor(Date.now() / 1000) - END_PERIOD_HOURS * 60 * 60 // Events that ended END_PERIOD_HOURS ago.
    },
    uid: { $ne: null },
    attestationData: null
  });

  if (!events.length) {
    console.log('No events found.')
    return;
  }

  for (const event of events) {
    try {
      await requestAttestation(event.uid);
    } catch (error) {
      console.log('Error while requesting attestation: ');
      console.log(error);
  
      await sendSlackWebhook(
        `
        Error while requesting attestation for event:\n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Error: \`${error.message}\`\n
        `,
        true
      );
      continue;
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
  
  requestEventAttestations()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}