sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/base/Log"
], function (Controller, Log) {
    "use strict";

    return Controller.extend("ui5generator.util.SapUi5Detector", {

        _aSapUi5Libs: null,

        /**
         * Loads the list from the TXT file (only once)
         */
        _loadSapUi5Libs: async function () {
            if (this._aSapUi5Libs) {
                return this._aSapUi5Libs;
            }

            try {
                const response = await fetch("models/sapui5_components.txt");
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
         * Checks whether the XML requires SAPUI5
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
