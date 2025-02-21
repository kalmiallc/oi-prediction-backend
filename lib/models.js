import mongoose from 'mongoose';

/**
 * Sports event model.
 */
const sportEventModel = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true },
  gender: { type: String, required: true },
  genderByIndex: { type: Number, required: true },
  group: { type: String, required: true },
  sport: { type: String, required: true },
  sportByIndex: { type: Number, required: true },
  uid: { type: String, required: false, unique: true, sparse: true },
  match: { type: String, required: true },
  teams: [
    { type: String, required: false, default: [] }
  ],
  choices:[
    {
      choice: { type: String, required: false },
      initialBet: { type: Number, required: false }
    }
  ],
  initialPool: { type: Number, required: true },
  winner: { type: Number, required: false, default: null },
  attestationData: {
    encodedAttestationRequest: { type: Object, required: false },
    attestationSubmitTime: { type: Number, required: false },
    roundOffset: { type: String, required: false },
    roundDuration: { type: String, required: false },
    submissionRoundID: { type: String, required: false },
    fullProof: { type: Object, required: false }
  },
  _externalId: { type: String, required: false },
  canceled: { type: Boolean, default: false },
  txHash: { type: String, required: false }
});

const SportEventModel = mongoose.model('SportEvent', sportEventModel, 'sportEvents');

export default SportEventModel;