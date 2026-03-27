sap.ui.define([], function () {
    "use strict";

    function getGlobalConfig() {
        if (typeof window === "undefined" || !window.ui5generatorConfig) {
            return {};
        }

        return window.ui5generatorConfig;
    }

    function normalizeEndpoint(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    function normalizeAuthType(value, hasEndpoint) {
        const authType = String(value || "").trim().toLowerCase();
        if (["none", "apikey", "bearer"].includes(authType)) {
            return authType;
        }

        return hasEndpoint ? "apikey" : "none";
    }

    function getManagedBackendConfig() {
        const globalConfig = getGlobalConfig();
        const backendConfig = globalConfig.backend || {};
        const endpoint = normalizeEndpoint(backendConfig.endpoint);
        const hasEndpoint = !!endpoint;

        return {
            endpoint: endpoint,
            authType: normalizeAuthType(backendConfig.authType, hasEndpoint)
        };
    }

    function getDefaultBackendConfig() {
        const managedBackend = getManagedBackendConfig();
        const hasManagedBackend = !!managedBackend.endpoint;

        return {
            type: hasManagedBackend ? "saas" : "custom",
            endpoint: hasManagedBackend ? managedBackend.endpoint : "",
            authType: hasManagedBackend ? managedBackend.authType : "none",
            apiKey: "",
            token: "",
            customEndpoint: ""
        };
    }

    return {
        getDefaultBackendConfig: getDefaultBackendConfig,

        hasManagedBackend: function () {
            return !!getManagedBackendConfig().endpoint;
        }
    };
});
