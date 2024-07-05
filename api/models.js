import mongoose from 'mongoose';

const sportEventModel = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  gender: { type: String, required: true },
  group: { type: String, required: true },
  teams: [{ type: String, required: true }],
  uuid: { type: String, required: true, unique: true },
  match: { type: String, required: true },
  choice1: { type: String, required: true },
  choice2: { type: String, required: true },
  choice3: { type: String, required: true },
  initialOdds1: { type: Number, required: true },
  initialOdds2: { type: Number, required: true },
  initialOdds3: { type: Number, required: true },
  initialPool: { type: Number, required: true },
  winner: { type: Number, required: false, default: null },
});

const SportEventModel = mongoose.model('SportEvent', sportEventModel, 'sportEvents');

export default SportEventModel;