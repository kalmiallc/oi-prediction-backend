


import JSON5 from 'json5';
import moment from 'moment';
import OpenAI from 'openai';
import googleIt from "../../lib/google-it.js";
import SportEventModel from "../../lib/models.js";
import { sendSlackWebhook } from '../../lib/slack-webhook.js';

/**
 * Update results after this period of hours.
 */
const END_PERIOD_HOURS = 2;


/**
 * Checks if articles includes date.
 * @param {*} text Article text.
 * @returns Boolean.
 */
function articleIncludesDate(text) {
  const regex = /^\d{1,2}\. \b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b\. \d{4}/;
  return regex.test(text);
}

/**
 * Parses winner from obtained results.
 * @param {*} result Obtained results.
 * @param {*} teams Event teams.
 * @returns Winner index.
 */
function parseWinner(result, teams) {
  if (result === teams[0]) {
    return 1;
  }

  if (result === teams[1]) {
    return 2;
  }

  if (result === 'DRAW') {
    return 3;
  }

  return null;
}

// 

/**
 * Updates events results.
 */
export async function updateEventsResults() {
  const events = await SportEventModel.find({
    endTime: {
      $lte: Math.floor(Date.now() / 1000) - END_PERIOD_HOURS * 60 * 60 // Events that ended END_PERIOD_HOURS ago.
    },
    uid: { $ne: null },
    winner: null 
  });

  if (!events.length) {
    console.log('No events found.')
    return;
  }

  for (const event of events) {
    const teams = event.teams;
    const sport = event.sport;

    const choices = [...teams]
    if (event.choices.length > 2) {
      choices.push('DRAW')
    }
    choices.push('NO_RESULT')


    const articles = []
    try {
      const options = {
        // 'proxy': 'http://localhost:8118' // Maybe add proxy?
      };
  
      const results = await googleIt({ options, query: `${teams.join(' vs ')} olympics 2024 ${sport}`, limit: 10, disableConsole: true })
      for (const result of results) {
        const article = {
          title: result.title,
          text: result.snippet
        };
  
        if (articleIncludesDate(result.snippet)) {
          article.text = article.text.slice(18);
        }
  
        articles.push(article);
      }
    } catch(error) {
      console.log('Error while getting event results: ')
      console.log(error);

      await sendSlackWebhook(
        `
        Error while obtaining event results data: \n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Error: \`${error}\`\n
        `,
        true
      );
      continue;
    }


    if (!articles.length) {
      console.log('No results articles found for the given event.')
  
      await sendSlackWebhook(
        `
        No results articles found for the given event: \n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        `,
        true
      );
      continue;
    }
  
  
    
    let results = null;
    try {
      const openAiClient = new OpenAI({
        organization: process.env.OPEN_AI_ORGANIZATION_ID,
        apiKey: process.env.OPEN_AI_API_KEY
      });
  
      const response = await openAiClient.chat.completions.create(
        {
          model: 'gpt-4o',
          temperature: 0,
          response_format: {
            type: 'json_object'
          },
          messages: [
            {
              'role': 'system',
              'content': `CURRENT SYSTEM DATE AND TIME (YYYY-MM-DD HH:mm:ss): "${moment().format('YYYY-MM-DD HH:mm:ss')}`
            },
            {
              'role': 'user',
              'content': `From the following news articles obtain who won the match (${teams.join(' vs ')}). Return one of the following values: ${choices.map((c) => `"${c}"`).join(', ')}. Return "NO_RESULTS" if the actual result of the match cannot be determined or if the result is ambiguous. Result should be in the RFC8259 compliant JSON response following this format without deviation: { "result": "sport event result value from the list of possible values", "reason": "why was the selected value returned" }. Articles: ${JSON.stringify(
                articles
              )}`
            }
          ]
        },
        {
          timeout: 60 * 1000, // 1 minute.
          maxRetries: 3
        }
      );
  
      results = JSON5.parse(response?.choices[0]?.message?.content);
    } catch (error) {
      console.log('Error while parsing results from Open AI: ');
      console.log(error);
  

      await sendSlackWebhook(
        `
        Error while parsing results from Open AI:\n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Error: \`${error}\`\n
        `,
        true
      );
      continue;
    }

    if (!results || !results?.result || !results?.reason) {
      console.log('No results obtained from Open AI.')

      await sendSlackWebhook(
        `
        No results obtained from Open AI:\n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Results: \`${JSON.stringify(results || {}, null, 2)}\`\n
        `,
        true
      );
      continue;
    }


    event.results = results;
    event.winner = parseWinner(results.result, teams)
    await event.save();

    if (event.winner) {
      await sendSlackWebhook(
        `
        Results obtained for event:\n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Results: \`${JSON.stringify(results, null, 2)}\`\n
        `,
      );

    } else {
      await sendSlackWebhook(
        `
        No results obtained for event:\n
        - UID: \`${event.uid}\`\n
        - Teams: \`${event.teams.join(' vs ')}\`\n
        - Sport: \`${event.sport}\`\n
        - Results: \`${JSON.stringify(results, null, 2)}\`\n
        `,
        true
      );
    }
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