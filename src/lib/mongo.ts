import { MongoClient } from 'mongodb';

/**
 * @name connect
 * @summary Connect to Mongo
 * @param {string} url - URL connections string for mongo
 * @param {Object} options - Any options for Mongo
 * @return {Promise}
 */
export const mongoConnect = (url) => new Promise((resolve, reject) => {

    const options = {
        useUnifiedTopology: true
    };
    // Connect to mongo
    MongoClient.connect(url, options, (err, client) => {
        if (err) { return reject(err); }
        return resolve(client);
    });

});


