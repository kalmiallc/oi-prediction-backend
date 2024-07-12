import SportEventModel from "./../api/models.js";

const getAllEvents = async (req, res) => {
  const events = await SportEventModel.find({});
  res.send(events);
};

const getEventByUid = async (req, res) => {
  const event = await SportEventModel.findOne({ uid: req.params.uid });
  res.send(event);
};

const getEventsByFilter = async (req, res) => {
  const events = await SportEventModel.find({ ...req.query });
  res.send(events);
};

const getWinnerForEvent = async (req, res) => {
  const event = await SportEventModel.findOne({ uid: req.params.uid });
  res.send({ uid: event.uid, winner: event.winner });
};


export { getAllEvents, getEventByUid, getEventsByFilter, getWinnerForEvent };
