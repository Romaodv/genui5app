sap.ui.define([
    "sap/ui/base/Object"
], function (Object) {
    "use strict";

    const STORAGE_KEY = "fiori_gen_backend";
    const DEFAULT_CONFIG = {
        type: "saas",
        endpoint: "https://ycickiqg7cul6zay2gmkttac6i0pnouz.lambda-url.us-east-1.on.aws/",
        authType: "apikey",
        apiKey: ""
    };

    return Object.extend("ui5generator.service.AIBackendService", {

        _getConfig: function () {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : DEFAULT_CONFIG;
            } catch (e) {
                return DEFAULT_CONFIG;
            }
        },

        _buildHeaders: function (config) {
            const headers = {
                "Content-Type": "application/json"
            };

            if (config.type === "saas" && config.apiKey) {
                headers["X-API-Key"] = config.apiKey;
            } else if (config.authType === "bearer" && config.token) {
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