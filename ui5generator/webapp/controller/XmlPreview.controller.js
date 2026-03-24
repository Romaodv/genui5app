sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/mvc/XMLView",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (Controller, XMLView, JSONModel, MessageBox) {
    "use strict";

    return Controller.extend("ui5generator.controller.XmlPreview", {
        onNavButtonPress: function (oEvent) {
            var oApp = this.getView().getParent();
            oApp.back();
            this.getView().destroy();
        }
    });
});