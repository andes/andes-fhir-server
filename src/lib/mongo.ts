import { MongoClient } from 'mongodb';

/**
 * @name mongoConnect
 * @summary Connect to MongoDB using MongoDB Driver 6.x
 * @param {string} url - MongoDB connection string
 * @return {Promise<MongoClient>} - Connected client
 */
export const mongoConnect = async (url: string) => {
    const client = new MongoClient(url);
    await client.connect();
    return client;
};