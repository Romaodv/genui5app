sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, MessageToast, MessageBox) {
    "use strict";

    const STORAGE_KEY = "fiori_gen_backend";
    const DEFAULT_CONFIG = {
        type: "saas",
        endpoint: "https://ycickiqg7cul6zay2gmkttac6i0pnouz.lambda-url.us-east-1.on.aws/",
        authType: "apikey",
        apiKey: "",
        token: "",
        customEndpoint: ""
    };

    return Controller.extend("ui5generator.controller.Settings", {
        onInit: function () {
            this._loadSettings();
        },

        _t: function (key, args) {
            const oBundle = this.getView().getModel("i18n").getResourceBundle();
            return oBundle.getText(key, args);
        },

        _loadSettings: function () {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                const config = raw ? JSON.parse(raw) : DEFAULT_CONFIG;
                this._applyConfigToView(config);
            } catch (e) {
                this._applyConfigToView(DEFAULT_CONFIG);
            }
        },

        _applyConfigToView: function (config) {
            const type = config.type || "saas";

            this.byId("selectBackendType").setSelectedKey(type);
            this.byId("inputApiKey").setValue(config.apiKey || "");
            this.byId("inputEndpoint").setValue(config.customEndpoint || "");
            this.byId("selectAuthType").setSelectedKey(config.authType || "none");
            this.byId("inputToken").setValue(config.token || "");

            const bTokenVisible = (config.authType || "none") !== "none";
            this.byId("inputToken").setVisible(bTokenVisible);
            this.byId("labelToken").setVisible(bTokenVisible);

            this._togglePanels(type);
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
                if (!config.apiKey || config.apiKey.trim().length < 10) {
                    return this._t("settings.error.invalidApiKey");
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

            const config = {
                type: type,
                endpoint: type === "saas"
                    ? DEFAULT_CONFIG.endpoint
                    : this.byId("inputEndpoint").getValue().trim(),
                customEndpoint: this.byId("inputEndpoint").getValue().trim(),
                authType: authType,
                apiKey: type === "saas"
                    ? this.byId("inputApiKey").getValue().trim()
                    : authType === "apikey"
                        ? this.byId("inputToken").getValue().trim()
                        : "",
                token: authType === "bearer"
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
                        this._applyConfigToView(DEFAULT_CONFIG);
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

            const config = JSON.parse(raw);
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
