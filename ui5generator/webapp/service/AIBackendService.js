sap.ui.define([
    "sap/ui/base/Object",
    "ui5generator/config/AppConfig"
], function (BaseObject, AppConfig) {
    "use strict";

    const STORAGE_KEY = "fiori_gen_backend";

    function getDefaultConfig() {
        return Object.assign({}, AppConfig.getDefaultBackendConfig());
    }

    return BaseObject.extend("ui5generator.service.AIBackendService", {

        _getConfig: function () {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : {};
                const config = Object.assign(getDefaultConfig(), parsed);

                if (config.type === "saas") {
                    const defaultConfig = getDefaultConfig();
                    config.endpoint = defaultConfig.endpoint;
                    config.authType = defaultConfig.authType;
                }

                return config;
            } catch (e) {
                return getDefaultConfig();
            }
        },

        _buildHeaders: function (config) {
            const headers = {
                "Content-Type": "application/json"
            };

            if (config.authType === "bearer" && config.token) {
                headers["Authorization"] = `Bearer ${config.token}`;
            } else if (config.authType === "apikey" && config.apiKey) {
                headers["X-API-Key"] = config.apiKey;
            }

            return headers;
        },

        generateView: async function (payload) {
            const config  = this._getConfig();
            const headers = this._buildHeaders(config);

            return fetch(config.endpoint, {
                method:  "POST",
                headers: headers,
                body:    JSON.stringify(payload)
            })
            .then(async function (res) {
                if (!res.ok) {
                    return res.json().then(function (err) {
                        throw new Error(err.error || `HTTP ${res.status}`);
                    });
                }
                return res.json();
            });
        }
    });
});
