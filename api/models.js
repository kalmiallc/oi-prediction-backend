import mongoose from 'mongoose';

/***
 * Sports event model.
 */
const sportEventModel = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  gender: { type: String, required: true },
  genderByIndex: { type: Number, required: true },
  group: { type: String, required: false },
  sport: { type: String, required: true },
  sportByIndex: { type: Number, required: true },
  uid: { type: String, required: false, unique: true },
  match: { type: String, required: true },
  teams: [
    { type: String, required: true }
  ],
  choices: [
    {
      choice: { type: String, required: true },
      initialBet: { type: Number, required: true }
    }
  ],
  initialPool: { type: Number, required: true },
  winner: { type: Number, required: false, default: null },
  _externalId: { type: String, required: false }
});

const SportEventModel = mongoose.model('SportEvent', sportEventModel, 'sportEvents');

export default SportEventModel;