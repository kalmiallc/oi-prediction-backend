import SportEventModel from "./models.js";

const getAllEvents = async (req, res) => {
  const events = await SportEventModel.find({});
  res.send(events);
};

const getEventByUid = async (req, res) => {
  const event = await SportEventModel.findOne({ uid: req.params.uid });
  res.send(event);
};

const getEventsByFilter = async (req, res) => {
  let query = { ...req.query };
  // Check if 'teams' is part of the query and adjust the query to use $in operator
  if (query.teams) {
    query.teams = { $in: query.teams.split(',') }; // Assuming teams are provided as a comma-separated list
  }
  const events = await SportEventModel.find(query);
  res.send(events);
};

const getWinnerForEvent = async (req, res) => {
  const event = await SportEventModel.findOne({ uid: req.params.uid });
  res.send({ uid: event.uid, winner: event.winner });
};


export { getAllEvents, getEventByUid, getEventsByFilter, getWinnerForEvent };
