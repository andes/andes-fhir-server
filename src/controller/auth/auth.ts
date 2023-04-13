import { CONSTANTS } from './../../constants';
import { setObjectId as objectId } from './../../utils/uid.util';
const globals = require('../../globals');


export async function searchToken(id) {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    const collection = db.collection(CONSTANTS.COLLECTION.AUTHAPPS);
    const registroDelToken = await collection.findOne({ token: id });
    return registroDelToken;
}
