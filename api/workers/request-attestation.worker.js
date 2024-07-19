import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import SportEventModel from "../../lib/models.js";
import { sendSlackWebhook } from '../../lib/slack-webhook.js';
import { requestAttestation } from '../../lib/attestation.js';

/**
 * Updates events results.
 */
export async function requestAttestations() {
  const events = await SportEventModel.find({
    uid: { $ne: null },
    winner: { $ne: null },
    results: { $ne: null },
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
      console.log('Error while getting attestation results: ');
      console.log(error);
  
      await sendSlackWebhook(
        `
        Error while getting attestation for event:\n
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
  
  requestAttestations()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}