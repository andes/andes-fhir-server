import { MongoClient } from 'mongodb';

/**
 * @name connect
 * @summary Connect to Mongo
 * @param {string} url - URL connections string for mongo
 * @param {Object} options - Any options for Mongo
 * @return {Promise}
 */
export const mongoConnect = (url) => {

    const options = {
        useUnifiedTopology: true
    };
    // Connect to mongo
    return MongoClient.connect(url, options);

}


