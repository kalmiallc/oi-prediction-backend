/**
 * Sends a webhook message to Slack.
 *
 * @param message Message to send.
 * @param tagChannel If present, the channel will be tagged.
 */
export async function sendSlackWebhook(message, tagChannel = false) {
  const payload = {
    channel: '#flare-results-logs',
    username: 'Flare Results Bot',
    text: `${message}`,
    icon_emoji: ':robot_face:'
  };

  if (tagChannel) {
    payload.text = `<!channel> ${payload.text}`;
  }

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok, status: ${response.status}`);
    }

   console.log('Slack webhook successfully sent.');
  } catch (error) {
    console.log('Error while sending webhook to Slack: ');
    console.log(error)
  }
}
