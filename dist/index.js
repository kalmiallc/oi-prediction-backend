import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import bodyParser from 'body-parser';
const version = process.env.npm_package_version;
// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.send('oi-flare-proxy-api: ' + version);
});
app.post('/login', urlencodedParser, function (req, res) {
    if (!req.body)
        return res.sendStatus(400);
    res.send(`welcome, ${req.body.username}`);
});
app.listen(3000, () => console.log('Server ready on port 3000.'));
export default app;
