"use strict";
module.exports = promise => promise
    .then(data => [undefined, data])
    .catch(err => [err]);
//# sourceMappingURL=async-handler.js.map