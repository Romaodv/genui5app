QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
    "use strict";

    sap.ui.require([
        "ui5generator/test/unit/utils/WireframeXmlGenerator.qunit"
    ], function () {
        QUnit.start();
    });
});
