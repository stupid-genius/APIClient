const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const router = express.Router();

function processHeaders(req, res, next){
	// console.log(`${req.method}:${req.originalUrl}\nheaders: ${JSON.stringify(req.headers, null, 2)}\nbody: ${JSON.stringify(req.body, null, 2)}`);
	if(req.headers['x-delay']){
		setTimeout(() => {
			next();
		}, req.headers['x-delay']);
	}else{
		next();
	}
}

router.use(express.static(`${__dirname}/`));
router.use(processHeaders, (req, res) => {
	const response = {
		body: req.body,
		headers: req.headers,
		method: req.method,
		path: req.path,
		query: req.query
	};
	// console.log(JSON.stringify(response));
	res.status(200).send(JSON.stringify(response)).end();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use((req, _res, next) => {console.log(`req: ${req.originalUrl}`); next();});
app.use(router);

if(require.main === module){
	app.listen(3000, 'localhost', () => {
		console.log('Test server listening on http://localhost:3000');
	});
}else{
	module.exports = app;
}
