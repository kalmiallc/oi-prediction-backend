import parseResults from "./result-parser.js";

export default function handler(req, res) {
  parseResults()
    .then((number) => {
      res.send({ numberParsed: number });
    })
    .catch((err) => {
      res.status(500).send({ error: err });
    });
}
