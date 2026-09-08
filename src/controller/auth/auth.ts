import { CONSTANTS } from '../../constants';
import { ObjectId } from 'mongodb';
import globals from '../../globals';

export async function searchToken(id: string) {
    if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
        return null;
    }
    const db = globals.get(CONSTANTS.CLIENT_DB);
    if (!db) {
        return null;
    }
    const collection = db.collection(CONSTANTS.COLLECTION.AUTHAPPS);
    const registroDelToken = await collection.findOne({
        $or: [
            { token: new ObjectId(id) },
            { token: id }
        ]
    });
    return registroDelToken;
}
