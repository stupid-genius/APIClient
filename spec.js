const { assert, expect } = require('chai');

describe('APIClient', function(){
	let client, registry;
	before(async function(){
		try{
			registry = (await import('./registry')).registry;
			client = (await import('./APIClient')).APIClient(registry);
		}catch(e){
			console.error(e);
		}
	});
	after(function(){});
	it('should build from registry', function(){
		Object.keys(registry).forEach((entry) => {
			assert(client[entry] !== undefined, `Client should contain ${entry}`);
		});
	});
	it('should return Promise', async function(){
		try{
			const response = await client.getEndpoint({ search: 'term' });
			const result = JSON.parse(response);
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'GET');
			expect(result.query.term).exist;
		}catch(err){
			assert(false, err);
		}
	});
	it('should GET', async function(done){
		const response = await client.getEndpoint({
			search: 'term',
			success: (res) => {
				const result = JSON.parse(res);
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'GET');
				expect(result.query.term).exist;
				done();
			},
			failure: () => {
				assert(false, err);
			}
		});
	});
	it('should POST', function(done){
		const username = 'bogus';
		const password = 'password';
		client.postEndpoint({
			username,
			password,
			success: (res) => {
				const result = JSON.parse(res);
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'POST');
				assert.equal(result.body.username, username);
				assert.equal(result.body.password, password);
				done();
			},
			failure: (err) => {
				assert(false, err);
			}
		});
	});
	it.skip('should PUT', function(){});
	it('should DELETE', async function(){
		const token = 'bWlnaHR5IG5vc2V5IGFyZW4ndCB3ZT8K';
		try{
			const response = await client.deleteEndpoint({
				search: 'term',
				token
			});
			const result = JSON.parse(response);
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'DELETE');
			expect(result.query.term).exist;
			assert.equal(result.headers.not_a_cookie, `SESSIONID=${token}`);
		}catch(err){
			assert(false, err);
		}
	});
	it('should use Fetch API', async function(){
		const path = 'category';
		const payload = {
			test: true
		};
		try{
			const response = await client.fetchTest({
				type: path,
				payload
			});
			const result = await response.json();
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, `/${path}/resource`);
			expect(result.body).deep.equal(payload);
		}catch(err){
			assert(false, err);
		}
	});
	it('should use custom', function(done){
		const slot = 100;
		const uuid = 'QWxsZW4gd2FzIGhlcmUK';
		client.customTest({
			slot,
			uuid,
			success: (response) => {
				const result = JSON.parse(response);
				// console.log(JSON.stringify(result, null, 2));
				assert.equal(result.method, 'POST');
				assert.equal(result.path, '/metrics');
				expect(result.body).deep.equal({slot: `${slot}`, uuid: `${uuid}`});
				done();
			},
			failure: (err) => {
				assert(false, err);
			}
		});
	});
	it('should support rate limiting', async function(){
		let shouldThrottle = false;
		try{
			let response = await client.throttleTest({});
			const result = await response.json();
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			shouldThrottle = true;
			response = await client.throttleTest({});
		}catch(err){
			// console.error('Caught: ', JSON.stringify(err, null, 2));
			assert(shouldThrottle, 'should not have throttled');
		}
	});
	it('should support timeout', async function(){
		this.timeout(5000);
		let shouldTimeout = false;
		try{
			let response = await client.timeoutTest({});
			const result = JSON.parse(response);
			// console.log(JSON.stringify(result, null, 2));
			assert.equal(result.method, 'POST');
			assert.equal(result.path, '/timeout');
			shouldTimeout = true;
			response = await client.timeoutTest({ delay: 3000 });
		}catch(err){
			// console.error('Caught: ', JSON.stringify(err, null, 2));
			assert(shouldTimeout, 'should not have timedout');
		}
	});
});
