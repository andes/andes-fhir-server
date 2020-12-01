import * as jwt from 'jsonwebtoken';
import { setObjectId as objectId } from './../../utils/uid.util';
const env = require('var');
import { CONSTANTS } from './../../constants';
const globals = require('../../globals');

export function verifyToken(token) {
    try {
        return jwt.verify(token, env.TOKEN_PASS);
    } catch (err) {
        return null
    }

}

export async function searchToken(id) {
    let db = globals.get(CONSTANTS.CLIENT_DB);
    let collection = db.collection(`${CONSTANTS.COLLECTION.AUTHAPPS}`);
    let registroDelToken = await collection.findOne({ _id: objectId(id) });
    return registroDelToken;
}
