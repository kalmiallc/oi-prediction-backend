import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const app = express();
import bodyParser from 'body-parser';
import proxy from 'express-http-proxy';


const version = '1.0.0'

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// act as get proxy for the https://coston2-api.flare.network/ext/C/rpc
app.use('/rpc', proxy('coston2-api.flare.network/ext/C/rpc'));

app.get('/', function (req, res) {
	res.send('oi-flare-proxy-api: ' + version);
});




app.listen(3000, () => console.log('Server ready on port 3000.'));

export default app;
