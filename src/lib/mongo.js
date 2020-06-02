"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoConnect = void 0;
const mongodb_1 = require("mongodb");
/**
 * @name connect
 * @summary Connect to Mongo
 * @param {string} url - URL connections string for mongo
 * @param {Object} options - Any options for Mongo
 * @return {Promise}
 */
exports.mongoConnect = (url) => new Promise((resolve, reject) => {
    const options = {
        useUnifiedTopology: true
    };
    // Connect to mongo
    mongodb_1.MongoClient.connect(url, options, (err, client) => {
        if (err) {
            return reject(err);
        }
        return resolve(client);
    });
});
//# sourceMappingURL=mongo.js.map