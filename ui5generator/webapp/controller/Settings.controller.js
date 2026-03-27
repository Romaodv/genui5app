sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "ui5generator/config/AppConfig"
], function (Controller, MessageToast, MessageBox, AppConfig) {
    "use strict";

    const STORAGE_KEY = "fiori_gen_backend";

    function getDefaultConfig() {
        return Object.assign({}, AppConfig.getDefaultBackendConfig());
    }

    function normalizeEndpoint(value) {
        return String(value || "").trim().replace(/\/+$/, "");
    }

    return Controller.extend("ui5generator.controller.Settings", {
        onInit: function () {
            this._loadSettings();
        },

        _t: function (key, args) {
            const oModel = this.getOwnerComponent().getModel("i18n")
                || this.getView().getModel("i18n")
                || sap.ui.getCore().getModel("i18n");
            const oBundle = oModel && oModel.getResourceBundle ? oModel.getResourceBundle() : null;

            if (!oBundle) {
                return key;
            }

            return oBundle.getText(key, args);
        },

        _loadSettings: function () {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const config = Object.assign(getDefaultConfig(), raw ? JSON.parse(raw) : {});
                if (config.type === "saas") {
                    const defaultConfig = getDefaultConfig();
                    config.endpoint = defaultConfig.endpoint;
                    config.authType = defaultConfig.authType;
                }
                this._applyConfigToView(config);
            } catch (e) {
                this._applyConfigToView(getDefaultConfig());
            }
        },

        _applyConfigToView: function (config) {
            const hasManagedBackend = AppConfig.hasManagedBackend();
            const type = hasManagedBackend ? (config.type || "saas") : "custom";
            const managedConfig = getDefaultConfig();
            const managedCredential = managedConfig.authType === "bearer"
                ? (config.token || "")
                : (config.apiKey || "");

            this.byId("selectBackendType").setSelectedKey(type);
            this.byId("inputApiKey").setValue(managedCredential);
            this.byId("inputEndpoint").setValue(config.customEndpoint || "");
            this.byId("selectAuthType").setSelectedKey(config.authType || "none");
            this.byId("inputToken").setValue(config.token || "");
            this._applyManagedBackendState(managedConfig);

            const bTokenVisible = (config.authType || "none") !== "none";
            this.byId("inputToken").setVisible(bTokenVisible);
            this.byId("labelToken").setVisible(bTokenVisible);

            this._togglePanels(type);
        },

        _applyManagedBackendState: function (config) {
            const bVisible = config.authType !== "none";
            const sLabel = config.authType === "bearer"
                ? this._t("settings.authBearer")
                : this._t("settings.apiKey");
            const sPlaceholder = config.authType === "bearer"
                ? this._t("settings.defaultTokenPlaceholder")
                : this._t("settings.defaultApiKeyPlaceholder");

            this.byId("labelManagedCredential").setVisible(bVisible);
            this.byId("inputApiKey").setVisible(bVisible);
            this.byId("labelManagedCredential").setText(sLabel);
            this.byId("inputApiKey").setPlaceholder(sPlaceholder);
        },

        onBackendTypeChange: function (oEvent) {
            const key = oEvent.getSource().getSelectedKey();
            this._togglePanels(key);
        },

        _togglePanels: function (type) {
            this.byId("panelSaaS").setVisible(type === "saas");
            this.byId("panelBYO").setVisible(type === "custom");
        },

        onAuthTypeChange: function (oEvent) {
            const key = oEvent.getSource().getSelectedKey();
            const bVisible = key !== "none";

            this.byId("inputToken").setVisible(bVisible);
            this.byId("labelToken").setVisible(bVisible);

            if (bVisible) {
                this.byId("labelToken").setText(
                    key === "apikey" ? this._t("settings.apiKey") : this._t("settings.authBearer")
                );
            }
        },

        _validate: function (config) {
            if (config.type === "saas") {
                const defaultConfig = getDefaultConfig();
                if (!defaultConfig.endpoint) {
                    return this._t("settings.error.saasUnavailable");
                }
                if (defaultConfig.authType !== "none" && (!config.token || config.token.trim().length < 3)) {
                    return this._t("settings.error.missingDefaultCredential");
                }
                return null;
            }

            if (config.type === "custom") {
                if (!config.customEndpoint || !config.customEndpoint.startsWith("http")) {
                    return this._t("settings.error.invalidEndpoint");
                }
                if (config.authType !== "none" && !config.token) {
                    return this._t("settings.error.missingToken");
                }
                return null;
            }

            return this._t("settings.error.selectBackendType");
        },

        onSaveSettings: function () {
            const type = this.byId("selectBackendType").getSelectedKey();
            const authType = this.byId("selectAuthType").getSelectedKey();
            const defaultConfig = getDefaultConfig();
            const customEndpoint = normalizeEndpoint(this.byId("inputEndpoint").getValue());

            const config = {
                type: type,
                endpoint: type === "saas"
                    ? defaultConfig.endpoint
                    : customEndpoint,
                customEndpoint: customEndpoint,
                authType: type === "saas" ? defaultConfig.authType : authType,
                apiKey: type === "saas"
                    ? defaultConfig.authType === "apikey"
                        ? this.byId("inputApiKey").getValue().trim()
                        : ""
                    : authType === "apikey"
                        ? this.byId("inputToken").getValue().trim()
                        : "",
                token: type === "saas"
                    ? defaultConfig.authType === "bearer"
                        ? this.byId("inputApiKey").getValue().trim()
                        : defaultConfig.authType === "apikey"
                            ? this.byId("inputApiKey").getValue().trim()
                            : ""
                    : authType === "bearer"
                        ? this.byId("inputToken").getValue().trim()
                        : ""
            };

            const error = this._validate(config);
            if (error) {
                MessageBox.error(error);
                return;
            }

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
                MessageToast.show(this._t("settings.toast.saved"));
            } catch (e) {
                MessageBox.error(this._t("settings.error.save"));
            }
        },

        onClearSettings: function () {
            MessageBox.confirm(this._t("settings.confirm.reset"), {
                onClose: function (action) {
                    if (action === MessageBox.Action.OK) {
                        localStorage.removeItem(STORAGE_KEY);
                        this._applyConfigToView(getDefaultConfig());
                        MessageToast.show(this._t("settings.toast.reset"));
                    }
                }.bind(this)
            });
        },

        onTestConnection: function () {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                MessageBox.warning(this._t("settings.warn.saveBeforeTest"));
                return;
            }

            const config = Object.assign(getDefaultConfig(), JSON.parse(raw));
            const headers = { "Content-Type": "application/json" };

            if (config.authType === "apikey" && config.apiKey) {
                headers["X-API-Key"] = config.apiKey;
            } else if (config.authType === "bearer" && config.token) {
                headers["Authorization"] = "Bearer " + config.token;
            }

            this.byId("btnTest").setEnabled(false);
            this.byId("btnTest").setText(this._t("button.testing"));

            fetch(config.endpoint + "/health", {
                method: "GET",
                headers: headers
            })
                .then(function (res) {
                    if (res.ok) {
                        MessageToast.show(this._t("settings.toast.connectionSuccess"));
                    } else {
                        MessageBox.error(this._t("settings.error.endpointHttp", [res.status]));
                    }
                }.bind(this))
                .catch(function () {
                    MessageBox.error(this._t("settings.error.connectionFailed"));
                }.bind(this))
                .finally(function () {
                    this.byId("btnTest").setEnabled(true);
                    this.byId("btnTest").setText(this._t("button.testConnection"));
                }.bind(this));
        },

        onNavBack: function () {
            const oHistory = sap.ui.core.routing.History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMainView", {}, true);
            }
        }
    });
});
