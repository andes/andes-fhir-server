"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHttpRequest = void 0;
const request = require("request");
/**
 *
 *
 * @export
 * @param {*} params ={
            host,
            port,
            path,
            method: 'GET/PUT/POST...',
            rejectUnauthorized: boolean
        }
 * @returns {Promise<[status,body]>}
 */
function handleHttpRequest(params) {
    return new Promise((resolve, reject) => {
        request(params, (err, response, body) => {
            if (!err) {
                const status = response && response.statusCode;
                return resolve([status, body]);
            }
            else {
                return reject(err);
            }
        });
    });
}
exports.handleHttpRequest = handleHttpRequest;
//# sourceMappingURL=requestHandler.js.map