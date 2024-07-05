import SportEventModel from "./../api/models.js";

const getAllEvents = async (req, res) => {
  const events = await SportEventModel.find({});
  res.send(events);
};

const getEventByUuid = async (req, res) => {
  const event = await SportEventModel.findOne({ uuid: req.params.uuid });
  res.send(event);
};

const getEventsByFilter = async (req, res) => {
  const events = await SportEventModel.find({ ...req.query });
  res.send(events);
};

const getWinnerForEvent = async (req, res) => {
  const event = await SportEventModel.findOne({ uuid: req.params.uuid });
  res.send({ uuid: event.uuid, winner: event.winner });
};


export { getAllEvents, getEventByUuid, getEventsByFilter, getWinnerForEvent };
