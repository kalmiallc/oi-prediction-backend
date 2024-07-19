/**
 * Olympic API disciplines mapping.
 */
const disciplines = {
  Basketball: "BKB",
  Basketball3x3: "BK3",
  Badminton: "BDM",
  BeachVolley: "VBV",
  FieldHockey: "HOC",
  Football: "FBL",
  Handball: "HBL",
  TableTennis: "TTE",
  Tennis: "TTE",
  Volleyball: "VVO",
  WaterPolo: "WPO",
}


/**
 * Olympics API URL.
 */
const OLYMPICS_API_URL = 'https://sph-s-api.olympics.com/summer/schedules/api/ENG/schedule/discipline'

/**
 * Returns schedule fpr specific sport.
 * @param {*} sport Sport.
 * @returns Schedule.
 */
export async function getSchedule(sport) {
  const discipline = disciplines[sport];
  if (!discipline) {
    throw Error('Invalid sport discipline.');
  }

  try {
    let res = await fetch(`${OLYMPICS_API_URL}/${discipline}`);
    res = await res.json();

    return res.units;
  } catch (error) {
    console.log(error);
    
    throw error;
  }
}