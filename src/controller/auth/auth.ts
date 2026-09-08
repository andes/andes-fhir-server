import { CONSTANTS } from '../../constants';
import { ObjectId } from 'mongodb';
import globals from '../../globals';


export async function searchToken(id) {
    const db = globals.get(CONSTANTS.CLIENT_DB);
    const collection = db.collection(CONSTANTS.COLLECTION.AUTHAPPS);
    const registroDelToken = await collection.findOne({ token: new ObjectId(id) });
    return registroDelToken;
}
