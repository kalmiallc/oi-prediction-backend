import SportEventModel from "./models.js";
async function parseResults() {
    let numberOfParsedEvents = 0;
    // fist parse data from the google...
  
    // for now just set winners to some random SportEventRecords
    const events = await SportEventModel.find({});
    // set winners to some random SportEventRecords
    for (const event of events) {
      const random = Math.floor(Math.random() * 3) + 1;
      event.winner = random;
      console.log(`Setting winner ${random} for event ${event.uid}`);
      await event.save();
      numberOfParsedEvents++;
    }
    return numberOfParsedEvents;
  }
  
  export default parseResults;