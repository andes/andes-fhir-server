const shiroTrie = require('shiro-trie');

export class Permissions {

    /**
     * Devuelve una instancia de shiro. Implementa un cache en el request actual para mejorar la performance
     *
     * @private
     * @static
     * @param {Object} obj Corresponde al objeto actual
     *
     * @memberOf Permissions
     */
    private static getShiro(obj: Object): any {
        let shiro = (obj as any).shiro;
        if (!shiro) {
            shiro = shiroTrie.new();
            shiro.add((obj as any).permisos);
            (obj as any).shiro = shiro;
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
    static check(obj: Object | Request, string: string): boolean {
        if (!(obj as any).permisos) {
            return false;
        } else {
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
    static getPermissions(obj: Object, string: string): string[] {
        if (!(obj as any).permisos) {
            return null;
        } else {
            return this.getShiro(obj).permissions(string);
        }
    }

}