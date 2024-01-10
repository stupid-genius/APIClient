/*
 *	Governor rate limits calls to a given key
 *
 *	Can be configured to throttle calls to a maximum per second, minute, hour, or day.
 *	Return value is boolean indicating if the call is allowed
 *
 *	TODO:
 *	- allow throttling to total requests per period
 */
function Governor(key, rate, period='second'){
	const throttleInterval = (() => {
		let interval;
		switch(period){
			case 'minute':
				interval = 60000;
				break;
			case 'hour':
				interval = 3600000;
				break;
			case 'day':
				interval = 86400000;
				break;
			case 'second':
			default:
				interval = 1000;
		}
		return Math.round(interval/rate);
	})();

	Object.defineProperty(Governor, key, {
		get: function cache(){
			const now = Date.now();
			const elapsed = now - cache.last;

			const open = elapsed >= throttleInterval;
			if(open){
				cache.last = now;
			}
			return open;
		}
	});
}

/*
 * A client object that is bound to a set of endpoints
 *
 * TODO:
 * - cache busting
 * - handle synchronous calls
 * - promise version?
 */
function APIClientFactory(registry){
	if(!new.target){
		return new APIClientFactory(registry);
	}
	if(APIClientFactory.instance !== undefined){
		return APIClientFactory.instance;
	}

	const interpolate = function interpolator(template = "", model){
		if(template instanceof Object){
			const interpolated = {};
			for(const o in template){
				interpolated[o] = interpolator(template[o], model);
			}
			return interpolated;
		}
		return template.replace(/\{\{(.+?)\}\}/g, function(_match, br){
			return encodeURI(model[br] || "");
		});
	};

	const client = {
		get: function(entry, config){
			const req = new XMLHttpRequest();
			req.open(entry.method, interpolate(entry.url, config), entry.asynch);
			Object.keys(entry.headers).forEach((header) => {
				req.setRequestHeader(header, entry.headers[header]);
			});
			req.onload = function(){
				config.success(req.response);
			};
			req.onerror = function(e){
				config.failure(e);
			};
			req.send();
		},
		post: function(entry, config){
			const req = new XMLHttpRequest();
			req.open(entry.method, interpolate(entry.url, config), entry.asynch);
			Object.keys(entry.headers).forEach((header) => {
				req.setRequestHeader(header, entry.headers[header]);
			});
			req.onload = function(){
				config.success(req.response);
			};
			req.onerror = function(e){
				config.failure(e);
			};
			req.send(JSON.stringify(interpolate(entry.body, config)));
		},
		put: function(entry){
			console.log('put called for: '+entry.url);
		},
		_delete: function(){
			console.log('delete called for: '+entry.url);
		},
		fetch: function(entry, config){
			fetch(interpolate(entry.url, config), {
				method: entry.fetchMethod,
				headers: Object.entries(entry.headers).reduce((acc, [k, v]) => {
					acc[k] = v;
					return acc;
				}, {})
			});
		}
	};

	Object.keys(registry).forEach((key) => {
		const entry = registry[key];
		if(entry.rate){
			Governor(key, entry.rate, entry.period);
		}
		Object.defineProperty(this, key, {
			enumerable: true,
			value: function(config){
				// check args to allow config obj or loose args
				// if(arguments.length === 1 && typeof config === 'object'){
				// }
				return new Promise((res, rej) => {
					if(Governor[key] === false){
						const msg = `Call to ${key} throttled`;
						console.warn(msg);
						res(msg);
						return;
					}
					if(config.success === undefined){
						config.success = (resp) => {
							res(resp);
						};
						config.failure = (err) => {
							rej(err);
						};
					}else{
						res('Using provided callback');
					}
					client[entry.method].call(this, entry, config);
				});
			}
		});
	});

	Object.defineProperty(APIClientFactory, "instance", {
		value: this
	});
}

export const APIClient = APIClientFactory;
// module.exports = APIClientFactory;
