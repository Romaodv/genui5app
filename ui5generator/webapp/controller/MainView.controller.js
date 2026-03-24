sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "ui5generator/service/AIBackendService",
    "ui5generator/utils/SapUi5Detector",
    "sap/m/MessageBox"
],
    function (Controller, JSONModel, MessageToast, AIBackendService, SapUi5Detector, MessageBox) {
        "use strict";

        const GRID = 20;
        const ITEM_textYPES = {
            objectHeader: {
                labelKey: "comp.objectHeader",
                hintKey: "hint.objectHeader"
            },
            section: {
                labelKey: "comp.section",
                hintKey: "hint.section"
            },
            form: {
                labelKey: "comp.form",
                hintKey: "hint.form"
            },
            toolbar: {
                labelKey: "comp.toolbar",
                hintKey: "hint.toolbar"
            },
            title: {
                labelKey: "comp.title",
                hintKey: "hint.title"
            },
            text: {
                labelKey: "comp.text",
                hintKey: "hint.text"
            },
            label: {
                labelKey: "comp.label",
                hintKey: "hint.label"
            },
            input: {
                labelKey: "comp.input",
                hintKey: "hint.input"
            },
            select: {
                labelKey: "comp.select",
                hintKey: "hint.select"
            },
            date: {
                labelKey: "comp.date",
                hintKey: "hint.date"
            },
            button: {
                labelKey: "comp.button",
                hintKey: "hint.button"
            },
            table: {
                labelKey: "comp.table",
                hintKey: "hint.table"
            },
            status: {
                labelKey: "comp.status",
                hintKey: "hint.status"
            }
        };
        const LOADING_STEPS = [
            { labelKey: "loading.analyzing", subKey: "loading.analyzing.sub" },
            { labelKey: "loading.sending", subKey: "loading.sending.sub" },
            { labelKey: "loading.guidelines", subKey: "loading.guidelines.sub" },
            { labelKey: "loading.bestpractices", subKey: "loading.bestpractices.sub" },
            { labelKey: "loading.generating", subKey: "loading.generating.sub" },
            { labelKey: "loading.validating", subKey: "loading.validating.sub" }
        ];

        return Controller.extend("ui5generator.controller.MainView", {
            onInit: function () {
                this.getView().setModel(new JSONModel({
                    items: [],
                    selectedId: null,
                    selectionText: this._text("selection.none"),
                    selectionHint: this._text("selection.hint.default"),
                    xml: "",
                    status: this._text("status.ready")
                }), "view");

                this._nextId = 1;
                this._dragState = null;
                this._editorState = null;
                this._clickTimer = null;

                this._oBackendService = new AIBackendService();
            },

            _text: function (key, args) {
                const oView = this.getView && this.getView();
                const oViewModel = oView && oView.getModel && oView.getModel("i18n");
                const oComponent = this.getOwnerComponent && this.getOwnerComponent();
                const oComponentModel = oComponent && oComponent.getModel && oComponent.getModel("i18n");
                const oModel = oViewModel || oComponentModel;

                if (!oModel || !oModel.getResourceBundle) {
                    return key;
                }

                try {
                    const oBundle = oModel.getResourceBundle();
                    return oBundle && oBundle.getText ? oBundle.getText(key, args) : key;
                } catch (e) {
                    return key;
                }
            },

            onAfterRendering: function () {
                this._renderCanvas();
            },

            _getModel: function () {
                return this.getView().getModel("view");
            },

            _setStatus: function (text) {
                this._getModel().setProperty("/status", text);
            },

            _snap: function (value) {
                return Math.max(0, Math.round(value / GRID) * GRID);
            },

            _getTypeMeta: function (type) {
                const meta = ITEM_textYPES[type];
                if (meta) {
                    return {
                        label: this._text(meta.labelKey),
                        hint: this._text(meta.hintKey)
                    };
                }
                return {
                    label: type,
                    hint: this._text("selection.hint.default")
                };
            },

            _defaultData: function (type) {
                if (type === "objectHeader") {
                    return {
                        title: this._text("default.objectHeader.title"),
                        attributes: [
                            this._text("default.objectHeader.attr1"),
                            this._text("default.objectHeader.attr2"),
                            this._text("default.objectHeader.attr3")
                        ]
                    };
                }
                if (type === "section") {
                    return { text: this._text("default.section.text") };
                }
                if (type === "form") {
                    return {
                        title: this._text("default.form.title"),
                        fields: [this._text("default.form.field1"), this._text("default.form.field2"), this._text("default.form.field3")]
                    };
                }
                if (type === "toolbar") {
                    return { actions: [this._text("default.toolbar.action1"), this._text("default.toolbar.action2"), this._text("default.toolbar.action3")] };
                }
                if (type === "title") return { text: this._text("default.title.text") };
                if (type === "text") return { text: this._text("default.text.text") };
                if (type === "label") return { text: this._text("default.label.text") };
                if (type === "input") return { label: this._text("default.input.label") };
                if (type === "select") return { label: this._text("default.select.label") };
                if (type === "date") return { label: this._text("default.date.label") };
                if (type === "button") return { text: this._text("default.button.text") };
                if (type === "table") return { columns: [this._text("default.table.col1"), this._text("default.table.col2"), this._text("default.table.col3")] };
                if (type === "status") return { text: this._text("default.status.text"), state: "Information" };
                return {};
            },

            _createItem: function (type, x, y) {
                const items = this._getModel().getProperty("/items");

                return Object.assign({
                    id: this._nextId++,
                    type: type,
                    x: x != null ? x : 40 + items.length * 10,
                    y: y != null ? y : 40 + items.length * 10
                }, this._defaultData(type));
            },

            _getTypeFamily: function (type) {
                if (["objectHeader", "section", "title", "text", "label", "status"].includes(type)) {
                    return "display";
                }
                if (["input", "select", "date", "form"].includes(type)) {
                    return "form";
                }
                if (["button", "toolbar"].includes(type)) {
                    return "actions";
                }
                if (type === "table") {
                    return "collection";
                }
                return "other";
            },

            _getUi5Hints: function (type) {
                if (type === "objectHeader") return { controls: ["ObjectPageDynamicHeaderTitle", "ObjectIdentifier"], patterns: ["ObjectPage"] };
                if (type === "section") return { controls: ["ObjectPageSection", "ObjectPageSubSection"], patterns: ["ObjectPage"] };
                if (type === "form") return { controls: ["SimpleForm", "Form"], patterns: ["ObjectPage", "CreateEdit"] };
                if (type === "toolbar") return { controls: ["OverflowToolbar"], patterns: ["ActionsBar"] };
                if (type === "title") return { controls: ["Title"], patterns: ["Header"] };
                if (type === "text") return { controls: ["Text"], patterns: ["Information"] };
                if (type === "label") return { controls: ["Label"], patterns: ["FormLabel"] };
                if (type === "input") return { controls: ["Input"], patterns: ["FormField"] };
                if (type === "select") return { controls: ["Select", "ComboBox"], patterns: ["FormField"] };
                if (type === "date") return { controls: ["DatePicker"], patterns: ["FormField"] };
                if (type === "button") return { controls: ["Button"], patterns: ["Action"] };
                if (type === "table") return { controls: ["Table", "ColumnListItem"], patterns: ["ListReport", "SectionContent"] };
                if (type === "status") return { controls: ["ObjectStatus"], patterns: ["SemanticState"] };
                return { controls: [], patterns: [] };
            },

            _estimateItemSize: function (item) {
                const widthByType = {
                    objectHeader: 540,
                    section: 540,
                    form: 540,
                    toolbar: 420,
                    title: 280,
                    text: 260,
                    label: 220,
                    input: 340,
                    select: 340,
                    date: 340,
                    button: 140,
                    table: 420,
                    status: 120
                };
                const heightByType = {
                    objectHeader: 130,
                    section: 56,
                    form: 260,
                    toolbar: 64,
                    title: 42,
                    text: 34,
                    label: 28,
                    input: 54,
                    select: 54,
                    date: 54,
                    button: 44,
                    table: 170,
                    status: 34
                };

                const dynamicTableWidth = item.type === "table"
                    ? Math.max(420, ((item.columns && item.columns.length) ? item.columns.length : 3) * 160)
                    : (widthByType[item.type] || 200);

                return {
                    width: dynamicTableWidth,
                    height: heightByType[item.type] || 60
                };
            },

            _extractItemContent: function (item) {
                if (item.type === "objectHeader") {
                    return { title: item.title || "", attributes: item.attributes || [] };
                }
                if (item.type === "form") {
                    return { title: item.title || "", fields: item.fields || [] };
                }
                if (item.type === "toolbar") {
                    return { actions: item.actions || [] };
                }
                if (item.type === "table") {
                    return { columns: item.columns || [] };
                }
                if (item.type === "status") {
                    return { text: item.text || "", state: item.state || "Information" };
                }
                if (item.type === "section" || item.type === "title" || item.type === "text" || item.type === "label" || item.type === "button") {
                    return { text: item.text || "" };
                }
                if (item.type === "input" || item.type === "select" || item.type === "date") {
                    return { label: item.label || "" };
                }
                return {};
            },

            _buildAiItems: function (sortedItems) {
                let sectionCounter = 0;
                let currentSection = null;

                return sortedItems.map(function (item, index) {
                    if (item.type === "section") {
                        sectionCounter += 1;
                        currentSection = {
                            id: item.id,
                            title: item.text || this._text("ai.sectionDefault", [sectionCounter]),
                            order: sectionCounter
                        };
                    }

                    const size = this._estimateItemSize(item);
                    const hints = this._getUi5Hints(item.type);
                    const content = this._extractItemContent(item);

                    return Object.assign({}, item, {
                        order: {
                            index: index + 1,
                            vertical: item.y,
                            horizontal: item.x
                        },
                        geometry: {
                            x: item.x,
                            y: item.y,
                            estimatedWidth: size.width,
                            estimatedHeight: size.height,
                            gridSnap: GRID
                        },
                        semantics: {
                            type: item.type,
                            family: this._getTypeFamily(item.type),
                            isSectionMarker: item.type === "section",
                            sectionContext: currentSection ? {
                                id: currentSection.id,
                                title: currentSection.title,
                                order: currentSection.order
                            } : null
                        },
                        ui5Hints: hints,
                        content: content
                    });
                }.bind(this));
            },

            _addItem: function (type) {
                const model = this._getModel();
                const items = model.getProperty("/items");
                const item = this._createItem(type);

                items.push(item);
                model.setProperty("/items", items);
                this._selectItem(item.id);
                this._renderCanvas();
                this._setStatus(this._text("status.componentAdded", [this._getTypeMeta(type).label]));
            },

            onAddObjectHeader: function () { this._addItem("objectHeader"); },
            onAddSection: function () { this._addItem("section"); },
            onAddForm: function () { this._addItem("form"); },
            onAddToolbar: function () { this._addItem("toolbar"); },
            onAddTitle: function () { this._addItem("title"); },
            onAddText: function () { this._addItem("text"); },
            onAddLabel: function () { this._addItem("label"); },
            onAddInput: function () { this._addItem("input"); },
            onAddSelect: function () { this._addItem("select"); },
            onAddDate: function () { this._addItem("date"); },
            onAddButton: function () { this._addItem("button"); },
            onAddTable: function () { this._addItem("table"); },
            onAddStatus: function () { this._addItem("status"); },

            _loadPreset: function (items, statusText) {
                this._nextId = 1;
                const seededItems = items.map(function (item) {
                    const newItem = Object.assign({ id: this._nextId++ }, item);
                    return newItem;
                }.bind(this));

                this._getModel().setProperty("/items", seededItems);
                this._getModel().setProperty("/selectedId", null);
                this._getModel().setProperty("/selectionText", this._text("selection.none"));
                this._getModel().setProperty("/selectionHint", this._text("selection.hint.default"));
                this._renderCanvas();
                this._setStatus(statusText);
            },

            onLoadObjectPagePreset: function () {
                this._loadPreset([
                    {
                        type: "objectHeader",
                        x: 40,
                        y: 30,
                        title: this._text("preset.object.headerTitle"),
                        attributes: [this._text("preset.object.headerAttr1"), this._text("preset.object.headerAttr2"), this._text("preset.object.headerAttr3")]
                    },
                    {
                        type: "toolbar",
                        x: 40,
                        y: 130,
                        actions: [this._text("preset.object.action1"), this._text("preset.object.action2"), this._text("preset.object.action3")]
                    },
                    {
                        type: "section",
                        x: 40,
                        y: 210,
                        text: this._text("preset.object.section1")
                    },
                    {
                        type: "form",
                        x: 40,
                        y: 260,
                        title: this._text("preset.object.formTitle"),
                        fields: [this._text("preset.object.field1"), this._text("preset.object.field2"), this._text("preset.object.field3"), this._text("preset.object.field4")]
                    },
                    {
                        type: "section",
                        x: 40,
                        y: 560,
                        text: this._text("preset.object.section2")
                    },
                    {
                        type: "table",
                        x: 40,
                        y: 620,
                        columns: [this._text("preset.object.tableCol1"), this._text("preset.object.tableCol2"), this._text("preset.object.tableCol3")]
                    },
                    {
                        type: "status",
                        x: 600,
                        y: 35,
                        text: this._text("preset.object.status"),
                        state: "Success"
                    }
                ], this._text("status.presetObjectLoaded"));
            },

            onLoadWorklistPreset: function () {
                this._loadPreset([
                    {
                        type: "title",
                        x: 40,
                        y: 30,
                        text: this._text("preset.worklist.title")
                    },
                    {
                        type: "toolbar",
                        x: 40,
                        y: 90,
                        actions: [this._text("preset.worklist.action1"), this._text("preset.worklist.action2"), this._text("preset.worklist.action3")]
                    },
                    {
                        type: "form",
                        x: 40,
                        y: 160,
                        title: this._text("preset.worklist.formTitle"),
                        fields: [this._text("preset.worklist.field1"), this._text("preset.worklist.field2"), this._text("preset.worklist.field3"), this._text("preset.worklist.field4")]
                    },
                    {
                        type: "table",
                        x: 40,
                        y: 460,
                        columns: [this._text("preset.worklist.tableCol1"), this._text("preset.worklist.tableCol2"), this._text("preset.worklist.tableCol3")]
                    },
                    {
                        type: "status",
                        x: 560,
                        y: 32,
                        text: this._text("preset.worklist.status"),
                        state: "Information"
                    }
                ], this._text("status.presetWorklistLoaded"));
            },

            _selectItem: function (id) {
                const model = this._getModel();
                model.setProperty("/selectedId", id);

                const item = model.getProperty("/items").find(function (entry) {
                    return entry.id === id;
                });
                const meta = item ? this._getTypeMeta(item.type) : null;

                model.setProperty("/selectionText", item ? this._text("selection.selected", [meta.label, item.id]) : this._text("selection.none"));
                model.setProperty("/selectionHint", item ? meta.hint : this._text("selection.hint.default"));
            },

            onDeleteSelected: function () {
                const model = this._getModel();
                const selectedId = model.getProperty("/selectedId");
                let items = model.getProperty("/items");

                if (selectedId == null) {
                    this._setStatus(this._text("status.noSelectedItem"));
                    return;
                }

                items = items.filter(function (item) {
                    return item.id !== selectedId;
                });
                model.setProperty("/items", items);
                model.setProperty("/selectedId", null);
                model.setProperty("/selectionText", this._text("selection.none"));
                model.setProperty("/selectionHint", this._text("selection.hint.default"));
                this._renderCanvas();
                this._setStatus(this._text("status.itemRemoved"));
            },

            onClearCanvas: function () {
                const model = this._getModel();
                model.setProperty("/items", []);
                model.setProperty("/selectedId", null);
                model.setProperty("/selectionText", this._text("selection.none"));
                model.setProperty("/selectionHint", this._text("selection.hint.default"));
                model.setProperty("/xml", "");
                this._renderCanvas();
                this._setStatus(this._text("status.canvasCleared"));
            },

            onGenerateXml: function () {
                const sortedItems = this._getModel().getProperty("/items").slice().sort(function (a, b) {
                    return a.y - b.y || a.x - b.x;
                });
                const items = this._buildAiItems(sortedItems);
                const oCanvas = document.getElementById("canvas-root");

                if (!oCanvas) {
                    MessageToast.show(this._text("toast.noWireframe"));
                    return;
                }

                html2canvas(oCanvas, {
                    backgroundColor: "#ffffff",
                    scale: 2,
                    useCORS: true
                }).then(function (canvas) {
                    const sBase64 = canvas.toDataURL("image/png");
                    const oPayload = {
                        items: items,
                        imgBase64: sBase64.includes(",") ? sBase64.split(",")[1] : sBase64
                    };

                    this._callApi(oPayload);
                }.bind(this)).catch(function (error) {
                    MessageBox.error(this._text("error.capture", [error.message]));
                });
            },

            _callApi: async function (payload) {
                this._showLoading();
                this._oBackendService.generateView(payload)
                    .then(async function (oResult) {
                        const oDetector = new SapUi5Detector();
                        const bNeedsSapUi5 = await oDetector.requiresSapUi5(oResult.xml);
                        this._getModel().setProperty("/isSapUi5", bNeedsSapUi5);
                        this._getModel().setProperty("/xml", oResult.xml);
                        this._openXmlViewer();
                    }.bind(this))
                    .catch(function (error) {
                        MessageBox.error(this._text("error.generateView", [error.message]));
                    })
                    .finally(function () {
                        this._hideLoading();
                    }.bind(this));
            },

            _showLoading: function () {
                if (!this._oLoadingDialog) {
                    this._oLoadingDialog = sap.ui.xmlfragment(
                        this.getView().getId(),
                        "ui5generator.view.LoadingDialog",
                        this
                    );
                    this.getView().addDependent(this._oLoadingDialog);
                }

                this._oLoadingDialog.open();
                this._loadingIndex = 0;
                this._startLoadingCycle();
            },

            _startLoadingCycle: function () {
                this._loadingIndex = 0;
                this._loadingTimers = [];

                const next = function () {
                    if (!this._oLoadingDialog || !this._oLoadingDialog.isOpen()) {
                        return;
                    }

                    const step = LOADING_STEPS[this._loadingIndex];
                    this.byId("loadingStep").setText(this._text(step.labelKey));
                    this.byId("loadingSub").setText(this._text(step.subKey));

                    this._loadingIndex = (this._loadingIndex + 1) % LOADING_STEPS.length;

                    const timer = setTimeout(next, 1400);
                    this._loadingTimers.push(timer);
                }.bind(this);

                next();
            },

            _hideLoading: function () {
                if (this._loadingTimers) {
                    this._loadingTimers.forEach(clearTimeout);
                    this._loadingTimers = [];
                }
                if (this._oLoadingDialog) {
                    this._oLoadingDialog.close();
                }
            },

            _openXmlViewer: function () {
                if (!this._oDialogXml) {
                    this._oDialogXml = sap.ui.xmlfragment("dialogXML", "ui5generator.view.XmlViewer", this);
                    this.getView().addDependent(this._oDialogXml);
                }
                this._oDialogXml.open();
            },

            onCloseDialog: function () {
                this._oDialogXml.close();
            },
            onPreview: async function () {
                const sXml = this._getModel().getProperty("/xml");
                const oComponent = this.getOwnerComponent();
                const oRoot = oComponent && oComponent.getRootControl ? oComponent.getRootControl() : null;
                const sAppId = oComponent && oComponent.createId ? oComponent.createId("app") : null;
                const oApp = (oComponent && oComponent.byId && oComponent.byId("app"))
                    || (oRoot && oRoot.byId && oRoot.byId("app"))
                    || (sAppId ? sap.ui.getCore().byId(sAppId) : null);

                try {
                    if (!oApp) {
                        throw new Error("App container not found");
                    }

                    const oOldView = sap.ui.getCore().byId(oComponent.createId("dynamicView"));
                    if (oOldView) {
                        oOldView.destroy();
                    }

                    const oView = await sap.ui.core.mvc.XMLView.create({
                        definition: sXml,
                        id: oComponent.createId("dynamicView")
                    });

                    const oPage = oView.getContent()[0];

                    this._preparePreviewNavigation(oView);
                    oApp.addPage(oPage);
                    oApp.to(oPage.getId());

                    this._oDialogXml.close();
                } catch (e) {
                    console.error(this._text("error.preview"), e);
                    MessageBox.error(this._text("error.preview"));
                }
            },

            onNavButtonPress: function () {
                const oComponent = this.getOwnerComponent();
                const oRoot = oComponent && oComponent.getRootControl ? oComponent.getRootControl() : null;
                const sAppId = oComponent && oComponent.createId ? oComponent.createId("app") : null;
                const oApp = (oComponent && oComponent.byId && oComponent.byId("app"))
                    || (oRoot && oRoot.byId && oRoot.byId("app"))
                    || (sAppId ? sap.ui.getCore().byId(sAppId) : null);

                if (oApp) {
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
            },

            _preparePreviewNavigation: function (oView) {
                const aPages = oView.findAggregatedObjects(true, function (control) {
                    return control && control.isA && control.isA("sap.m.Page");
                }) || [];
                const oPage = aPages[0];

                if (!oPage) {
                    return;
                }

                oPage.setShowNavButton(true);
                oPage.detachNavButtonPress(this.onNavButtonPress, this);
                oPage.attachNavButtonPress(this.onNavButtonPress, this);
            },

            onSettings: function () {
                this.getOwnerComponent().getRouter().navTo("RouteSettings");
            },

            onCopyXml: function () {
                const xml = this._getModel().getProperty("/xml");
                if (!xml) {
                    this._setStatus(this._text("status.nothingToCopy"));
                    return;
                }

                navigator.clipboard.writeText(xml).then(function () {
                    MessageToast.show(this._text("toast.xmlCopied"));
                }.bind(this));
            },

            _xmlEscape: function (value) {
                return String(value)
                    .replaceAll("&", "&amp;")
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;");
            },

            _escapeHtml: function (value) {
                return String(value)
                    .replaceAll("&", "&amp;")
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;")
                    .replaceAll("'", "&#39;");
            },

            _safeHandlerName: function (text) {
                if (!text) {
                    return "Action";
                }

                const cleaned = text
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-zA-Z0-9 ]/g, "")
                    .trim()
                    .split(/\s+/)
                    .map(function (word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join("");

                return cleaned || "Action";
            },

            _renderFieldPreview: function (label, type, showLabel) {
                const value = type === "select" ? this._text("field.select.placeholder") : type === "date" ? this._text("field.date.placeholder") : this._text("field.input.placeholder");
                const selectClass = type === "select" ? " select" : "";
                const safeLabel = this._escapeHtml(label || "");
                const fieldClass = showLabel === false ? "wfField noLabel" : "wfField";
                const boxContent = safeLabel || this._escapeHtml(value);

                return [
                    '<div class="' + fieldClass + '">',
                    showLabel === false ? "" : ('  <div class="wfLabel">' + safeLabel + ":</div>"),
                    '  <div class="wfBox' + selectClass + '">' + boxContent + "</div>",
                    "</div>"
                ].join("");
            },

            _buildItemHtml: function (item, selectedId) {
                const selectedClass = item.id === selectedId ? " selected" : "";
                let inner = "";

                if (item.type === "objectHeader") {
                    inner = [
                        '<div class="wfObjectHeader">',
                        '  <div class="wfObjectTitle">' + this._escapeHtml(item.title || this._text("fallback.object")) + "</div>",
                        '  <div class="wfObjectMeta">' + (item.attributes || []).map(function (attr) {
                            return '<span>' + this._escapeHtml(attr) + "</span>";
                        }.bind(this)).join("") + "</div>",
                        "</div>"
                    ].join("");
                } else if (item.type === "section") {
                    inner = [
                        '<div class="wfSection">',
                        '  <div class="wfSectionTitle">' + this._escapeHtml(item.text || this._text("fallback.section")) + "</div>",
                        "</div>"
                    ].join("");
                } else if (item.type === "form") {
                    inner = [
                        '<div class="wfFormBlock">',
                        '  <div class="wfFormTitle">' + this._escapeHtml(item.title || this._text("fallback.form")) + "</div>",
                        '  <div class="wfFormFields">' + (item.fields || []).map(function (field, index) {
                            const fieldType = index % 3 === 1 ? "select" : index % 3 === 2 ? "date" : "input";
                            return this._renderFieldPreview(field, fieldType, true);
                        }.bind(this)).join("") + "</div>",
                        "</div>"
                    ].join("");
                } else if (item.type === "toolbar") {
                    inner = [
                        '<div class="wfToolbar">',
                        (item.actions || []).map(function (action, index) {
                            const actionClass = index === 0 ? "wfToolbarAction emphasized" : "wfToolbarAction";
                            return '<div class="' + actionClass + '">' + this._escapeHtml(action) + "</div>";
                        }.bind(this)).join(""),
                        "</div>"
                    ].join("");
                } else if (item.type === "title") {
                    inner = '<div class="wfTitle">' + this._escapeHtml(item.text) + "</div>";
                } else if (item.type === "text") {
                    inner = '<div class="wfText">' + this._escapeHtml(item.text) + "</div>";
                } else if (item.type === "label") {
                    inner = '<div class="wfDisplayLabel">' + this._escapeHtml(item.text) + "</div>";
                } else if (item.type === "input" || item.type === "select" || item.type === "date") {
                    inner = this._renderFieldPreview(item.label, item.type, false);
                } else if (item.type === "button") {
                    inner = '<div class="wfButton">' + this._escapeHtml(item.text) + "</div>";
                } else if (item.type === "table") {
                    const cols = (item.columns && item.columns.length) ? item.columns : [this._text("default.table.col1"), this._text("default.table.col2"), this._text("default.table.col3")];
                    const gridTemplate = "repeat(" + cols.length + ", minmax(0, 1fr))";
                    const cells = cols.map(function () {
                        return "<div>...</div>";
                    }).join("");
                    inner = [
                        '<div class="wfTable">',
                        '  <div class="wfTableHeader" style="grid-template-columns:' + gridTemplate + ';">',
                        cols.map(function (col) {
                            return "<div>" + this._escapeHtml(col) + "</div>";
                        }.bind(this)).join(""),
                        "  </div>",
                        '  <div class="wfTableRow" style="grid-template-columns:' + gridTemplate + ';">' + cells + "</div>",
                        '  <div class="wfTableRow" style="grid-template-columns:' + gridTemplate + ';">' + cells + "</div>",
                        "</div>"
                    ].join("");
                } else if (item.type === "status") {
                    inner = '<div class="wfStatus wfStatus' + this._escapeHtml(item.state || "Information") + '">' + this._escapeHtml(item.text || this._text("comp.status")) + "</div>";
                }

                return '<div class="wfItem' + selectedClass + '" data-id="' + item.id + '" style="left:' + item.x + "px; top:" + item.y + 'px;">' + inner + "</div>";
            },

            _refreshItemPreview: function (item) {
                const canvas = document.getElementById("canvas-root");
                if (!canvas || !item) {
                    return;
                }

                const currentEl = canvas.querySelector('.wfItem[data-id="' + item.id + '"]');
                if (!currentEl) {
                    return;
                }

                const selectedId = this._getModel().getProperty("/selectedId");
                const wrapper = document.createElement("div");
                wrapper.innerHTML = this._buildItemHtml(item, selectedId);
                const nextEl = wrapper.firstElementChild;

                if (!nextEl) {
                    return;
                }

                currentEl.className = nextEl.className;
                currentEl.innerHTML = nextEl.innerHTML;
                this._fitCanvasToViewport();
            },

            _fitCanvasToViewport: function () {
                const canvas = document.getElementById("canvas-root");
                if (!canvas) {
                    return;
                }

                const viewportHeight = window.innerHeight || 900;
                const topGap = 250;
                const targetHeight = Math.max(360, viewportHeight - topGap);
                canvas.style.height = targetHeight + "px";
            },

            _applyCanvasStaticTexts: function () {
                const placeholder = document.getElementById("canvas-placeholder");
                const editorHelp = document.querySelector("#canvas-editor .wfEditorHelp");

                if (placeholder) {
                    placeholder.textContent = this._text("canvas.placeholder");
                }
                if (editorHelp) {
                    editorHelp.textContent = this._text("canvas.editorHelp");
                }
            },

            _renderCanvas: function () {
                const canvas = document.getElementById("canvas-root");
                const placeholder = document.getElementById("canvas-placeholder");
                const editor = document.getElementById("canvas-editor");

                if (!canvas || !placeholder || !editor) {
                    return;
                }

                canvas.querySelectorAll(".wfItem").forEach(function (el) {
                    el.remove();
                });

                const model = this._getModel();
                const items = model.getProperty("/items");
                const selectedId = model.getProperty("/selectedId");

                placeholder.style.display = items.length ? "none" : "flex";
                editor.style.display = "none";

                items.forEach(function (item) {
                    const wrapper = document.createElement("div");
                    wrapper.innerHTML = this._buildItemHtml(item, selectedId);
                    const el = wrapper.firstElementChild;
                    canvas.appendChild(el);
                }.bind(this));

                this._applyCanvasStaticTexts();
                this._fitCanvasToViewport();
                this._bindCanvasEvents();
            },

            _bindCanvasEvents: function () {
                const canvas = document.getElementById("canvas-root");
                const editorInput = document.getElementById("canvas-editor-input");

                if (!canvas || !editorInput) {
                    return;
                }

                canvas.onclick = function (event) {
                    if (event.target === canvas) {
                        if (this._clickTimer) {
                            clearTimeout(this._clickTimer);
                            this._clickTimer = null;
                        }

                        this._getModel().setProperty("/selectedId", null);
                        this._getModel().setProperty("/selectionText", this._text("selection.none"));
                        this._getModel().setProperty("/selectionHint", this._text("selection.hint.default"));
                        this._renderCanvas();
                    }
                }.bind(this);

                canvas.querySelectorAll(".wfItem").forEach(function (el) {
                    el.onmousedown = null;
                    el.onclick = null;
                    el.ondblclick = null;

                    el.addEventListener("mousedown", function (event) {
                        event.stopPropagation();

                        const id = Number(el.dataset.id);

                        if (event.detail === 2) {
                            if (this._clickTimer) {
                                clearTimeout(this._clickTimer);
                                this._clickTimer = null;
                            }

                            this._openEditor(id);
                            return;
                        }

                        this._clickTimer = setTimeout(function () {
                            this._selectItem(id);
                            this._renderCanvas();
                            this._clickTimer = null;
                        }.bind(this), 220);

                        if (event.button !== 0) {
                            return;
                        }

                        const startX = event.clientX;
                        const startY = event.clientY;

                        const onMoveStart = function (moveEvent) {
                            const dx = Math.abs(moveEvent.clientX - startX);
                            const dy = Math.abs(moveEvent.clientY - startY);

                            if (dx > 4 || dy > 4) {
                                document.removeEventListener("mousemove", onMoveStart);
                                document.removeEventListener("mouseup", onMouseUpCancel);

                                if (this._clickTimer) {
                                    clearTimeout(this._clickTimer);
                                    this._clickTimer = null;
                                }

                                this._startDrag(el, id, startX, startY);
                            }
                        }.bind(this);

                        const onMouseUpCancel = function () {
                            document.removeEventListener("mousemove", onMoveStart);
                            document.removeEventListener("mouseup", onMouseUpCancel);
                        };

                        document.addEventListener("mousemove", onMoveStart);
                        document.addEventListener("mouseup", onMouseUpCancel);
                    }.bind(this));
                }.bind(this));

                editorInput.oninput = function () {
                    this._liveUpdateEditor();
                }.bind(this);
                editorInput.onkeydown = function (event) {
                    event.stopPropagation();

                    if (event.key === "Enter") {
                        this._closeEditor(true);
                    } else if (event.key === "Escape") {
                        this._closeEditor(false);
                    }
                }.bind(this);
            },

            _getEditableValue: function (item) {
                if (!item) {
                    return "";
                }
                if (item.type === "objectHeader") {
                    return (item.title || "") + " | " + (item.attributes || []).join(", ");
                }
                if (item.type === "form") {
                    return (item.title || "") + " | " + (item.fields || []).join(", ");
                }
                if (item.type === "toolbar") {
                    return (item.actions || []).join(", ");
                }
                if (item.type === "status") {
                    return (item.text || "") + " | " + (item.state || "Information");
                }
                if (["title", "text", "label", "button", "section"].includes(item.type)) {
                    return item.text || "";
                }
                if (["input", "select", "date"].includes(item.type)) {
                    return item.label || "";
                }
                if (item.type === "table") {
                    return (item.columns || []).join(", ");
                }
                return "";
            },

            _setEditableValue: function (item, value) {
                const clean = String(value || "").trim();
                if (!clean) {
                    return;
                }

                if (item.type === "objectHeader") {
                    const headerParts = clean.split("|");
                    item.title = (headerParts[0] || "").trim() || this._text("fallback.object");
                    item.attributes = (headerParts[1] || "")
                        .split(",")
                        .map(function (part) { return part.trim(); })
                        .filter(Boolean);
                    if (!item.attributes.length) {
                        item.attributes = [this._text("fallback.attribute1"), this._text("fallback.attribute2")];
                    }
                    return;
                }

                if (item.type === "form") {
                    const formParts = clean.split("|");
                    item.title = (formParts[0] || "").trim() || this._text("fallback.form");
                    item.fields = (formParts[1] || "")
                        .split(",")
                        .map(function (part) { return part.trim(); })
                        .filter(Boolean);
                    if (!item.fields.length) {
                        item.fields = [this._text("fallback.field1"), this._text("fallback.field2"), this._text("fallback.field3")];
                    }
                    return;
                }

                if (item.type === "toolbar") {
                    item.actions = clean.split(",")
                        .map(function (part) { return part.trim(); })
                        .filter(Boolean);
                    if (!item.actions.length) {
                        item.actions = [this._text("fallback.action")];
                    }
                    return;
                }

                if (item.type === "status") {
                    const statusParts = clean.split("|");
                    item.text = (statusParts[0] || "").trim() || this._text("comp.status");
                    item.state = (statusParts[1] || "Information").trim() || "Information";
                    return;
                }

                if (["title", "text", "label", "button", "section"].includes(item.type)) {
                    item.text = clean;
                } else if (["input", "select", "date"].includes(item.type)) {
                    item.label = clean;
                } else if (item.type === "table") {
                    const parts = clean.split(",").map(function (part) {
                        return part.trim();
                    }).filter(Boolean);
                    item.columns = parts.length ? parts : [this._text("default.table.col1"), this._text("default.table.col2"), this._text("default.table.col3")];
                }
            },

            _openEditor: function (id) {
                const canvas = document.getElementById("canvas-root");
                const editor = document.getElementById("canvas-editor");
                const editorInput = document.getElementById("canvas-editor-input");
                const el = canvas.querySelector('.wfItem[data-id="' + id + '"]');
                const item = this._getModel().getProperty("/items").find(function (entry) {
                    return entry.id === id;
                });

                if (!el || !item || !editor || !editorInput) {
                    return;
                }

                this._selectItem(id);

                this._editorState = {
                    id: id,
                    originalValue: this._getEditableValue(item)
                };

                editorInput.value = this._editorState.originalValue;
                editor.style.left = Math.min(el.offsetLeft, canvas.scrollLeft + canvas.clientWidth - 260) + "px";
                editor.style.top = Math.min(el.offsetTop + el.offsetHeight + 6, canvas.scrollTop + canvas.clientHeight - 60) + "px";
                editor.style.display = "block";
                editorInput.focus();
                editorInput.select();
            },

            _liveUpdateEditor: function () {
                if (!this._editorState) {
                    return;
                }

                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._editorState.id;
                }.bind(this));
                const editorInput = document.getElementById("canvas-editor-input");

                if (!item || !editorInput) {
                    return;
                }

                this._setEditableValue(item, editorInput.value);
                this._getModel().setProperty("/items", items);
                this._refreshItemPreview(item);
            },

            _closeEditor: function (save) {
                if (!this._editorState) {
                    return;
                }

                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._editorState.id;
                }.bind(this));

                if (!save && item) {
                    this._setEditableValue(item, this._editorState.originalValue);
                    this._getModel().setProperty("/items", items);
                }

                this._editorState = null;
                this._renderCanvas();

                if (save) {
                    this._setStatus(this._text("status.componentUpdated"));
                }
            },

            _startDrag: function (el, id, mouseX, mouseY) {
                if (this._editorState) {
                    this._closeEditor(true);
                }

                const canvas = document.getElementById("canvas-root");
                const item = this._getModel().getProperty("/items").find(function (entry) {
                    return entry.id === id;
                });

                if (!canvas || !el || !item) {
                    return;
                }

                const rect = canvas.getBoundingClientRect();

                this._selectItem(id);

                this._dragState = {
                    id: id,
                    offsetX: mouseX - rect.left + canvas.scrollLeft - item.x,
                    offsetY: mouseY - rect.top + canvas.scrollTop - item.y
                };

                this._boundOnDrag = this._onDrag.bind(this);
                this._boundStopDrag = this._stopDrag.bind(this);

                document.addEventListener("mousemove", this._boundOnDrag);
                document.addEventListener("mouseup", this._boundStopDrag);
            },

            _onDrag: function (event) {
                if (!this._dragState) {
                    return;
                }

                const canvas = document.getElementById("canvas-root");
                const rect = canvas.getBoundingClientRect();
                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._dragState.id;
                }.bind(this));

                if (!item) {
                    return;
                }

                if (event.clientY > rect.bottom - 40) {
                    canvas.scrollTop = Math.min(canvas.scrollTop + 24, canvas.scrollHeight);
                } else if (event.clientY < rect.top + 40) {
                    canvas.scrollTop = Math.max(canvas.scrollTop - 24, 0);
                }

                item.y = this._snap(event.clientY - rect.top + canvas.scrollTop - this._dragState.offsetY);
                item.x = this._snap(event.clientX - rect.left + canvas.scrollLeft - this._dragState.offsetX);

                item.x = Math.max(0, Math.min(item.x, canvas.clientWidth - 40));
                item.y = Math.max(0, Math.min(item.y, Math.max(canvas.clientHeight, canvas.scrollHeight + 120) - 40));

                this._getModel().setProperty("/items", items);
                this._renderCanvas();
            },

            _stopDrag: function () {
                if (this._dragState) {
                    this._setStatus(this._text("status.componentMoved"));
                }

                this._dragState = null;
                document.removeEventListener("mousemove", this._boundOnDrag);
                document.removeEventListener("mouseup", this._boundStopDrag);
            }
        });
    });
