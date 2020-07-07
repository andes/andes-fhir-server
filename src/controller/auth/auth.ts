import * as jwt from 'jsonwebtoken';
import { setObjectId as objectId } from './../../utils/uid.util';
const env = require('var');
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');

export function verifyToken(token) {
    try {
        return jwt.verify(token, env.TOKEN_PASS);
    } catch (err) {
        return null
    }

}

export async function searchToken(id) {
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.AUTHAPPS}`);
    let registroDelToken = await collection.findOne({ _id: objectId(id) });
    return registroDelToken;
}
