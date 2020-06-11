const { COLLECTION, CLIENT_DB } = require('./../../constants');
const globals = require('../../globals');


export async function buscarToken(token) {
    try {
        let db = globals.get(CLIENT_DB);
        let collection = db.collection(`${COLLECTION.AUTHAPPS}`);
        let result = await collection.findOne({ token });
        return result ? result : null;
    } catch (err) {
        return err
    }
}
