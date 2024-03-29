const Strategy = require('passport-http-bearer').Strategy;
const request = require('superagent');
const env = require('var');

/**
 * Bearer Strategy
 *
 * This strategy will handle requests with BearerTokens.  This is only a template and should be configured to
 * your AuthZ server specifications.
 *
 * Requires ENV variables for introspecting the token
 */

// Esto lo podemos dejar para más adelante para tener un único servidor que valide los tokens
// Per no es nuestro caso y vamos a usar el Auth que implemente.
module.exports.strategy = new Strategy(
	function (token, done) {

		console.log('lalo landa')


		if (!env.INTROSPECTION_URL) {
			return done(new Error('Invalid introspection endpoint.'));
		}

		request
			.post(env.INTROSPECTION_URL)
			.set('content-type', 'application/x-www-form-urlencoded')
			.send({ token: token, client_id: env.CLIENT_ID, client_secret: env.CLIENT_SECRET })
			.then((introspectionResponse) => {
				const decoded_token = introspectionResponse.body;
				if (decoded_token.active) {
					// TODO: context could come in many forms, you need to decide how to handle it.
					// it could also be decodedToken.patient etc...
					const { scope, context, sub, user_id } = decoded_token;
					const user = { user_id, sub };
					// return scopes and context.  Both required
					return done(null, user, { scope, context });
				}

				// default return unauthorized
				return done(new Error('Invalid token'));
			});
	}
);
