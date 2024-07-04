import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import proxy from 'express-http-proxy';


const version = '1.0.0'

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(express.static('public'));

app.get('/', function (req, res) {
	res.send('oi-flare-proxy-api: ' + version);
});

// act as get proxy for the https://coston2-api.flare.network/ext/C/rpc
app.use('/RPC', proxy('https://coston2-api.flare.network/ext/C/rpc'));


app.listen(3000, () => console.log('Server ready on port 3000.'));

export default app;
