import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import {
  getAllEvents,
  getEventByUid,
  getEventsByFilter,
  getWinnerForEvent,
} from "./controllers.js";
import ConnectDB from "./db.js";
import parseResults from "./result-parser.js";


const version = "1.0.0";

await ConnectDB();
app.get("/", function (req, res) {
  res.send("oi-flare-proxy-api: " + version);
});

app.get("/allEvents", getAllEvents);
app.get("/event/:uuid", getEventByUid);
app.get("/events", getEventsByFilter);
app.get("/event/winner/:uuid", getWinnerForEvent);
app.get("/run-parse", async (req, res) => {
  const number = await parseResults();
  res.send({ numberParsed: number });
});

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;
