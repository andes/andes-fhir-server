import * as jwt from 'jsonwebtoken';
import { setObjectId as objectId } from './../../utils/uid.util';
const env = require('var');
const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');


export function verifyToken(token) {
    const tokenData = jwt.verify(token, env.TOKEN_PASS);
    return tokenData ? tokenData : null;
}

export async function searchToken(id) {
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.AUTHAPPS}`);
    let token = await collection.findOne({ _id: objectId(id) });
    return token;

}