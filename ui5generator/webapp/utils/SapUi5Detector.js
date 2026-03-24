sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";
    return Object.extend("ui5generator.utils.SapUi5Detector", {

       _aSapUi5Libs: null,

        /**
         * Carrega lista do TXT (uma vez só)
         */
        _loadSapUi5Libs: async function () {
            if (this._aSapUi5Libs) {
                return this._aSapUi5Libs;
            }

            try {
                const response = await fetch("model/sapui5_components.txt");
                const text = await response.text();

                this._aSapUi5Libs = text
                    .split("\n")
                    .map(line => line.trim())
                    .filter(line => line && !line.startsWith("#"));

                return this._aSapUi5Libs;

            } catch (e) {
                Log.error("Erro ao carregar sapui5_components.txt", e);
                this._aSapUi5Libs = [];
                return [];
            }
        },

        /**
         * Verifica se o XML requer SAPUI5
         * @param {string} sXml
         * @returns {Promise<boolean>}
         */
        requiresSapUi5: async function (sXml) {
            if (!sXml) {
                return false;
            }

            const aLibs = await this._loadSapUi5Libs();

            return aLibs.some(lib => sXml.includes(lib));
        }
    });
});