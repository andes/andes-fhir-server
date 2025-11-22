import { MongoClient } from 'mongodb';

/**
 * @name mongoConnect
 * @summary Connect to MongoDB using MongoDB Driver 3.7.3
 * @param {string} url - MongoDB connection string
 * @return {Promise<MongoClient>} - Connected client
 */
export const mongoConnect = async (url: string) => {
    const client = new MongoClient(url);
    await client.connect();
    return client;
};