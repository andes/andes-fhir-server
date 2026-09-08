const Strategy = require('passport-http-bearer').Strategy;
const env = process.env;

/**
 * Bearer Strategy
 *
 * This strategy will handle requests with BearerTokens.  This is only a template and should be configured to
 * your AuthZ server specifications.
 *
 * Requires ENV variables for introspecting the token
 */

module.exports.strategy = new Strategy(
	function (token, done) {

		if (!env.INTROSPECTION_URL) {
			return done(new Error('Invalid introspection endpoint.'));
		}

		const body = new URLSearchParams({
			token: token,
			client_id: env.CLIENT_ID || '',
			client_secret: env.CLIENT_SECRET || ''
		});

		fetch(env.INTROSPECTION_URL, {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			body: body.toString()
		})
			.then(res => res.json())
			.then((decoded_token: any) => {
				if (decoded_token && decoded_token.active) {
					const { scope, context, sub, user_id } = decoded_token;
					const user = { user_id, sub };
					return done(null, user, { scope, context });
				}

				return done(new Error('Invalid token'));
			})
			.catch(err => done(err));
	}
);

