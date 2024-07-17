import * as dotenv from "dotenv";
import express from "express";
import {
  getAllEvents,
  getEventByUid,
  getEventsByFilter,
  getWinnerForEvent,
} from "../lib/controllers.js";
import ConnectDB from "../lib/db.js";


dotenv.config();
const app = express();

const version = "1.0.0";

await ConnectDB();

app.get("/", function (req, res) {
  res.send("oi-flare-proxy-api: " + version);
});
app.get("/allEvents", getAllEvents);
app.get("/event/:uid", getEventByUid);
app.get("/events", getEventsByFilter);
app.get("/event/winner/:uid", getWinnerForEvent);

app.listen(3000, () => console.log("Server ready on port 3000."));

export default app;
