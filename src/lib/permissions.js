"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permissions = void 0;
const shiroTrie = require('shiro-trie');
class Permissions {
    /**
     * Devuelve una instancia de shiro. Implementa un cache en el request actual para mejorar la performance
     *
     * @private
     * @static
     * @param {Object} obj Corresponde al objeto actual
     *
     * @memberOf Permissions
     */
    static getShiro(obj) {
        let shiro = obj.shiro;
        if (!shiro) {
            shiro = shiroTrie.new();
            shiro.add(obj.permisos);
            obj.shiro = shiro;
        }
        return shiro;
    }
    /**
   * Controla si el token contiene el string Shiro
   *
   * @static
   * @param {object} Object Corresponde al objeto que quiero consultar
   * @param {string} string String para controlar permisos
   * @returns {boolean} Devuelve verdadero si el token contiene el permiso
   *
   * @memberOf Permissions
   */
    static check(obj, string) {
        if (!obj.permisos) {
            return false;
        }
        else {
            return this.getShiro(obj).check(string);
        }
    }
    /**
     * Obtiene todos los permisos para el string Shiro indicado
     *
     * @static
     * @param {express.Request} req Corresponde al request actual
     * @param {string} string String para controlar permisos
     * @returns {string[]} Array con permisos
     *
     * @memberOf Permissions
     */
    static getPermissions(obj, string) {
        if (!obj.permisos) {
            return null;
        }
        else {
            return this.getShiro(obj).permissions(string);
        }
    }
}
exports.Permissions = Permissions;
//# sourceMappingURL=permissions.js.map