import Sports from "./types.js";

/**
 * Full schedule URL.
 */
const SCHEDULE_URL = 'https://olympics.com/en/paris-2024/schedule';

/**
 * Returns URL for specific sport.
 * @param {*} sport Sport.
 * @param {*} buildId Olympic site build ID.
 * @returns Events URL for specific sport.
 */
export const EVENTS_URL = (sport, buildId) => `https://olympics.com/_next/data/${buildId}/en/paris-2024/schedule/${sport}.json?deviceType=desktop&countryCode=AX&path=paris-2024&path=schedule&path=${sport}`


/**
 * URL encodings for specific sport.
 */
export const UrlSportEncoding = {
  Basketball: "basketball",
  Basketball3x3: "3x3-basketball",
  Badminton: "badminton",
  BeachVolley: "beach-volleyball",
  FieldHockey: "hockey",
  Football: "football",
  Handball: "handball",
  TableTennis: "table-tennis",
  Tennis: "tennis",
  Volleyball: "volleyball",
  WaterPolo: "water-polo",
};

/**
 * Which sports should be parsed.
 */
export const PARSE_SPORTS = [
  Sports.Basketball,
  Sports.Basketball3x3,
  Sports.FieldHockey,
  Sports.Football,
  Sports.Handball,
  Sports.Volleyball,
  Sports.WaterPolo,
]

/**
 * Returns olympic website build ID.
 * @returns Build ID.
 */
export async function getBuildId() {
  let htmlResponse = null;
  try {
    const res = await fetch(SCHEDULE_URL);
    htmlResponse = await res.text();
  } catch (error) {
    console.log(error);

    throw error;
  }

  let buildId = null;
  if (htmlResponse) {
    const match = htmlResponse.match(/"buildId":"(.*?)"/);
    if (match[1]) {
      buildId = match[1]
    }
  }

  return buildId;
}
