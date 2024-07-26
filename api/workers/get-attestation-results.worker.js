import dotenv from 'dotenv';
import ConnectDB from "../../lib/db.js";
import SportEventModel from "../../lib/models.js";
import { sendSlackWebhook } from '../../lib/slack-webhook.js';
import { getAttestationResult } from '../../lib/attestation.js';

/**
 * Update results after this period of hours.
 */
const ATTESTATION_RESULTS_OFFSET_MINUTES = 5;

/**
 * Gets events attestation results.
 */
export async function getEventAttestationResults() {
  const events = await SportEventModel.find({
    uid: { $ne: null },
    "attestationData.encodedAttestationRequest": { $ne: null },
    "attestationData.roundOffset": { $ne: null },
    "attestationData.roundDuration": { $ne: null },
    "attestationData.submissionRoundID": { $ne: null },
    "attestationData.attestationSubmitTime": {
      $lte: Math.floor(Date.now() / 1000) - ATTESTATION_RESULTS_OFFSET_MINUTES * 60 // Attestations that were submitted ATTESTATION_RESULTS_OFFSET_MINUTES ago.
    },
    "attestationData.fullProof": null,
    canceled: false
  });

  if (!events.length) {
    console.log('No events found.')
    return;
  }

  for (const event of events) {
    try {
      await getAttestationResult(event.uid);
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
  
  getEventAttestationResults()
    .then(() => {
      res.send({ ok: true });
    })
    .catch((err) => {
      res.status(500).send({ ok: false, error: err });
    });
}