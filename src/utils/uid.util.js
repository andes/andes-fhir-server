"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setObjectId = exports.getObjectId = exports.getUuid = exports.getUid = void 0;
const hash = require('object-hash');
const { ObjectID } = require('mongodb').ObjectID;
/**
 * Return a random int, used by `utils.getUid()`.
*
* @param {Number} min
* @param {Number} max
* @return {Number}
* @api private
*/
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Validates the date(s) and return the object containing the prefix and date.
 *
 * Prefix may contain 'ge, le, lt, gt'.
 *
 * @param {*} dates
 */
exports.getUid = function (length) {
    let uid = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    for (let i = 0; i < length; ++i) {
        uid += chars[getRandomInt(0, charsLength - 1)];
    }
    return uid;
};
/**
 * Make a hash of the object for use as a UUID.
 * TODO Improve this. Stuck this in just because it's more of a uniqueness guarantee than the above 'getUID' function.
 * TODO If we're actually going to generate hashes, we should probably do it in a more secure manner.
 * @param obj
 * @returns {*|*}
 */
exports.getUuid = (obj) => {
    return hash(obj);
};
exports.getObjectId = () => {
    return new ObjectID();
};
exports.setObjectId = (id) => {
    return new ObjectID(id);
};
//# sourceMappingURL=uid.util.js.map