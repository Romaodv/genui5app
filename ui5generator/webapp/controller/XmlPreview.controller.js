sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Component"
], function (Controller, Component) {
    "use strict";

    return Controller.extend("ui5generator.controller.XmlPreview", {
        _resolveComponent: function () {
            return (this.getOwnerComponent && this.getOwnerComponent())
                || Component.getOwnerComponentFor(this.getView())
                || null;
        },

        _findParentApp: function (oControl) {
            let oCurrent = oControl;

            while (oCurrent && oCurrent.getParent) {
                if (oCurrent.isA && oCurrent.isA("sap.m.App")) {
                    return oCurrent;
                }
                oCurrent = oCurrent.getParent();
            }

            return null;
        },

        _findCurrentPage: function (oControl) {
            let oCurrent = oControl;

            while (oCurrent && oCurrent.getParent) {
                if (oCurrent.isA && oCurrent.isA("sap.m.Page")) {
                    return oCurrent;
                }
                oCurrent = oCurrent.getParent();
            }

            const oView = this.getView();
            const aPages = oView && oView.findAggregatedObjects
                ? (oView.findAggregatedObjects(true, function (oCandidate) {
                    return oCandidate && oCandidate.isA && oCandidate.isA("sap.m.Page");
                }) || [])
                : [];

            return aPages[0] || null;
        },

        _resolveApp: function (oEvent) {
            const oSource = oEvent && oEvent.getSource ? oEvent.getSource() : null;
            const oPage = this._findCurrentPage(oSource);
            const oView = this.getView();
            const oComponent = this._resolveComponent();
            const oRoot = oComponent && oComponent.getRootControl ? oComponent.getRootControl() : null;
            const sAppId = oComponent && oComponent.createId ? oComponent.createId("app") : null;

            return this._findParentApp(oSource)
                || this._findParentApp(oPage)
                || this._findParentApp(oView)
                || (oView && oView.byId ? oView.byId("previewApp") : null)
                || (oComponent && oComponent.byId ? oComponent.byId("app") : null)
                || (oRoot && oRoot.byId ? oRoot.byId("app") : null)
                || (sAppId ? sap.ui.getCore().byId(sAppId) : null)
                || null;
        },

        _destroyDynamicPreview: function (oApp, oPage) {
            if (oApp && oPage && oApp.removePage) {
                oApp.removePage(oPage);
            }

            if (oPage && !oPage.bIsDestroyed) {
                oPage.destroy();
            }

            const oView = this.getView();
            if (oView && !oView.bIsDestroyed) {
                oView.destroy();
            }
        },

        onNavButtonPress: function (oEvent) {
            const oComponent = this._resolveComponent();
            const oApp = this._resolveApp(oEvent);
            const oPage = this._findCurrentPage(oEvent && oEvent.getSource ? oEvent.getSource() : null);

            if (oApp && oPage && oApp.attachAfterNavigate) {
                const fnAfterNavigate = function () {
                    oApp.detachAfterNavigate(fnAfterNavigate);
                    this._destroyDynamicPreview(oApp, oPage);
                }.bind(this);

                oApp.attachAfterNavigate(fnAfterNavigate);
                oApp.back();
                return;
            }

            const oHistory = sap.ui.core.routing.History.getInstance();
            const sPreviousHash = oHistory.getPreviousHash();
            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else if (oComponent && oComponent.getRouter) {
                oComponent.getRouter().navTo("RouteMainView", {}, true);
            }
        }
    });
});
