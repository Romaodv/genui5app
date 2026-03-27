sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "ui5generator/service/AIBackendService",
    "ui5generator/utils/SapUi5Detector",
    "sap/m/MessageBox",
    "ui5generator/model/SapUi5Properties",
    "ui5generator/utils/WireframeXmlGenerator"
],
    function (Controller, JSONModel, MessageToast, AIBackendService, SapUi5Detector, MessageBox, COMPONENT_PROPERTIES, WireframeXmlGenerator) {
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
                    selectedIds: [],
                    selectionText: this._text("selection.none"),
                    selectionHint: this._text("selection.hint.default"),
                    xml: "",
                    status: this._text("status.ready")
                }), "view");

                this._nextId = 1;
                this._dragState = null;
                this._resizeState = null;
                this._selectionBoxState = null;
                this._editorState = null;
                this._clickTimer = null;
                this._copiedItems = [];
                this._pasteOffset = 0;
                this._previewViewId = null;

                this._oBackendService = new AIBackendService();
            },

            _text: function (key, args) {
                const oView = this.getView && this.getView();
                const oViewModel = oView && oView.getModel && oView.getModel("i18n");
                const oComponent = this.getOwnerComponent && this.getOwnerComponent();
                const oComponentModel = oComponent && oComponent.getModel && oComponent.getModel("i18n");
                const oCoreModel = sap.ui.getCore && sap.ui.getCore().getModel ? sap.ui.getCore().getModel("i18n") : null;
                const oModel = oViewModel || oComponentModel || oCoreModel;

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
                this._bindGlobalKeyboardEvents();
                this._renderCanvas();
            },

            onExit: function () {
                if (this._boundGlobalKeydown) {
                    document.removeEventListener("keydown", this._boundGlobalKeydown);
                }
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

            _snapDelta: function (value) {
                return Math.round(value / GRID) * GRID;
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

            _cloneItem: function (item) {
                return JSON.parse(JSON.stringify(item || {}));
            },

            _getSelectedIds: function () {
                const model = this._getModel();
                const selectedIds = model.getProperty("/selectedIds");

                if (Array.isArray(selectedIds) && selectedIds.length) {
                    return selectedIds.map(Number).filter(function (id, index, values) {
                        return Number.isFinite(id) && values.indexOf(id) === index;
                    });
                }

                const selectedId = model.getProperty("/selectedId");
                return selectedId == null ? [] : [Number(selectedId)];
            },

            _setSelection: function (ids, primaryId) {
                const model = this._getModel();
                const items = model.getProperty("/items");
                const normalizedIds = (ids || []).map(Number).filter(function (id, index, values) {
                    return Number.isFinite(id)
                        && values.indexOf(id) === index
                        && items.some(function (entry) { return entry.id === id; });
                });
                const nextPrimaryId = normalizedIds.length
                    ? (normalizedIds.includes(primaryId) ? primaryId : normalizedIds[0])
                    : null;

                model.setProperty("/selectedIds", normalizedIds);
                model.setProperty("/selectedId", nextPrimaryId);

                if (!normalizedIds.length) {
                    model.setProperty("/selectionText", this._text("selection.none"));
                    model.setProperty("/selectionHint", this._text("selection.hint.default"));
                    return;
                }

                if (normalizedIds.length === 1) {
                    const item = items.find(function (entry) {
                        return entry.id === normalizedIds[0];
                    });
                    const meta = item ? this._getTypeMeta(item.type) : null;

                    model.setProperty("/selectionText", item ? this._text("selection.selected", [meta.label, item.id]) : this._text("selection.none"));
                    model.setProperty("/selectionHint", item ? meta.hint : this._text("selection.hint.default"));
                    return;
                }

                model.setProperty("/selectionText", this._text("selection.multiple", [normalizedIds.length]));
                model.setProperty("/selectionHint", this._text("selection.hint.multiple"));
            },

            _clearSelection: function () {
                this._setSelection([], null);
            },

            _toggleItemSelection: function (id) {
                const selectedIds = this._getSelectedIds();
                if (selectedIds.includes(id)) {
                    this._setSelection(selectedIds.filter(function (entryId) {
                        return entryId !== id;
                    }), null);
                    return;
                }

                this._setSelection(selectedIds.concat(id), id);
            },

            _isMultiSelectModifier: function (event) {
                return Boolean(event && (event.ctrlKey || event.metaKey || event.shiftKey));
            },

            _isEditableTarget: function (target) {
                if (!target || !target.tagName) {
                    return false;
                }

                const sTagName = String(target.tagName).toUpperCase();
                return sTagName === "INPUT"
                    || sTagName === "TEXTAREA"
                    || sTagName === "SELECT"
                    || Boolean(target.isContentEditable);
            },

            _bindGlobalKeyboardEvents: function () {
                if (this._boundGlobalKeydown) {
                    return;
                }

                this._boundGlobalKeydown = this._onGlobalKeydown.bind(this);
                document.addEventListener("keydown", this._boundGlobalKeydown);
            },

            _onGlobalKeydown: function (event) {
                const isEditableTarget = this._isEditableTarget(event.target);
                const isCopy = (event.ctrlKey || event.metaKey) && !event.shiftKey && String(event.key).toLowerCase() === "c";
                const isPaste = (event.ctrlKey || event.metaKey) && !event.shiftKey && String(event.key).toLowerCase() === "v";

                if (event.key === "Escape" && this._editorState) {
                    event.preventDefault();
                    this._closeEditor(false);
                    return;
                }

                if (isEditableTarget) {
                    return;
                }

                if (isCopy) {
                    event.preventDefault();
                    this._copySelectedItems();
                    return;
                }

                if (isPaste) {
                    event.preventDefault();
                    this._pasteCopiedItems();
                    return;
                }

                if ((event.key === "Delete" || event.key === "Backspace") && this._getSelectedIds().length) {
                    event.preventDefault();
                    this.onDeleteSelected();
                }
            },

            _createDefaultProperties: function (type) {
                const config = COMPONENT_PROPERTIES[type];
                const defaults = {};
                const skipDefaultsForTypes = ["form", "label", "input", "select", "date"];

                if (skipDefaultsForTypes.includes(type)) {
                    return defaults;
                }

                if (!config || !Array.isArray(config.properties)) {
                    return defaults;
                }

                config.properties.forEach(function (property) {
                    defaults[property.name] = property.defaultValue;
                });

                return defaults;
            },

            _normalizeItemProperties: function (item) {
                if (!item) {
                    return item;
                }

                item.ui5Properties = Object.assign({}, this._createDefaultProperties(item.type), item.ui5Properties || {});
                return item;
            },

            _hasUi5TextProperty: function (item) {
                return this._getComponentProperties(item && item.type).some(function (property) {
                    return property.name === "text";
                });
            },

            _syncItemTextProperty: function (item, value) {
                if (!item) {
                    return;
                }

                this._normalizeItemProperties(item);

                if (["title", "text", "label", "button", "section", "status"].includes(item.type)) {
                    item.text = value;
                }

                if (this._hasUi5TextProperty(item)) {
                    item.ui5Properties.text = value;
                }
            },

            _getComponentProperties: function (type) {
                const config = COMPONENT_PROPERTIES[type];
                return config && Array.isArray(config.properties) ? config.properties : [];
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
                    y: y != null ? y : 40 + items.length * 10,
                    ui5Properties: this._createDefaultProperties(type)
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
                    toolbar: 480,
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

                const explicitWidth = this._getConfiguredItemWidth(item);

                return {
                    width: explicitWidth || dynamicTableWidth,
                    height: heightByType[item.type] || 60
                };
            },

            _getConfiguredItemWidth: function (item) {
                const rawWidth = item && item.ui5Properties ? item.ui5Properties.width : null;
                const canvas = document.getElementById("canvas-root");
                const widthBase = this._getWidthResizeBase(item, canvas);

                if (rawWidth == null || rawWidth === "") {
                    return null;
                }

                if (typeof rawWidth === "number" && Number.isFinite(rawWidth)) {
                    return rawWidth;
                }

                const widthText = String(rawWidth).trim();
                const match = widthText.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)?$/i);

                if (!match) {
                    return null;
                }

                const value = parseFloat(match[1]);
                const unit = (match[2] || "px").toLowerCase();

                if (unit === "px") {
                    return Math.round(value);
                }

                if (unit === "rem" || unit === "em") {
                    return Math.round(value * 16);
                }

                if (unit === "%") {
                    return Math.round((widthBase * value) / 100);
                }

                return null;
            },

            _usesPercentWidth: function (type) {
                return ["objectHeader", "section", "form", "toolbar", "table"].includes(type);
            },

            _getWidthResizeBase: function (item, canvas) {
                const fallbackWidth = 960;
                const canvasWidth = canvas && canvas.clientWidth ? canvas.clientWidth : fallbackWidth;
                const itemX = item && typeof item.x === "number" ? item.x : 0;

                if (this._usesPercentWidth(item && item.type)) {
                    return Math.max(240, canvasWidth - itemX - 16);
                }

                return canvasWidth;
            },

            _formatItemWidth: function (item, widthPx, canvas) {
                const normalizedWidth = Math.max(this._getMinItemWidth(item.type), widthPx);

                if (this._usesPercentWidth(item.type)) {
                    const widthBase = this._getWidthResizeBase(item, canvas);
                    const percent = Math.max(10, Math.min(100, (normalizedWidth / widthBase) * 100));
                    return (Math.round(percent * 10) / 10) + "%";
                }

                const rem = normalizedWidth / 16;
                return (Math.round(rem * 10) / 10) + "rem";
            },

            _getMinItemWidth: function (type) {
                const minWidthByType = {
                    objectHeader: 320,
                    section: 240,
                    form: 320,
                    toolbar: 220,
                    title: 140,
                    text: 140,
                    label: 120,
                    input: 180,
                    select: 180,
                    date: 180,
                    button: 100,
                    table: 280,
                    status: 100
                };

                return minWidthByType[type] || 120;
            },

            _setItemWidth: function (item, width, canvas) {
                if (!item) {
                    return;
                }

                this._normalizeItemProperties(item);
                item.ui5Properties.width = this._formatItemWidth(item, width, canvas);
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
                    this._normalizeItemProperties(item);

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
                        content: content,
                        componentProperties: Object.assign({}, item.ui5Properties || {})
                    });
                }.bind(this));
            },

            _addItem: function (type) {
                const model = this._getModel();
                const items = model.getProperty("/items");
                const item = this._createItem(type);

                items.push(item);
                model.setProperty("/items", items);
                this._editorState = null;
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
                    const newItem = this._normalizeItemProperties(Object.assign({ id: this._nextId++ }, item));
                    return newItem;
                }.bind(this));

                this._getModel().setProperty("/items", seededItems);
                this._clearSelection();
                this._editorState = null;
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
                        x: 430,
                        y: 42,
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
                this._setSelection(id == null ? [] : [id], id);
            },

            onDeleteSelected: function () {
                const model = this._getModel();
                const selectedIds = this._getSelectedIds();
                let items = model.getProperty("/items");

                if (!selectedIds.length) {
                    this._setStatus(this._text("status.noSelectedItem"));
                    return;
                }

                items = items.filter(function (item) {
                    return !selectedIds.includes(item.id);
                });
                model.setProperty("/items", items);
                this._clearSelection();
                this._editorState = null;
                this._renderCanvas();
                this._setStatus(this._text("status.itemRemoved"));
            },

            onClearCanvas: function () {
                const model = this._getModel();
                model.setProperty("/items", []);
                this._clearSelection();
                model.setProperty("/xml", "");
                this._editorState = null;
                this._renderCanvas();
                this._setStatus(this._text("status.canvasCleared"));
            },

            onGenerateXml: async function () {
                // Sort by coordinates (x and y)
                var items = this._getModel().getProperty("/items").slice()
                    .sort(function (a, b) { return a.y - b.y || a.x - b.x; });

                // Is there a pattern inserted into canvas?
                var pattern = this.byId("patternSelect")
                    ? this.byId("patternSelect").getSelectedKey()
                    : null;

                // Generate XML from the current canvas items
                var oGenerator = new WireframeXmlGenerator();
                var oPreview = oGenerator.generate(items, { patternHint: pattern });


                this._getModel().setProperty("/xml", oPreview.xml);
                this._getModel().setProperty("/detectedPattern", oPreview.pattern);
                const oDetector = new SapUi5Detector();
                const bNeedsSapUi5 = await oDetector.requiresSapUi5(oPreview.xml);
                this._getModel().setProperty("/isSapUi5", bNeedsSapUi5);
                this._openXmlViewer();
            },
            onSendToAI: function () {
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
                        imgBase64: sBase64.includes(",") ? sBase64.split(",")[1] : sBase64,
                        xmlBase: this._getModel().getProperty("/xml")
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
                        // this._openXmlViewer();
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

                    this._destroyDynamicPreview(oApp);

                    const sPreviewViewId = oComponent.createId("dynamicView-" + Date.now());
                    const oView = await sap.ui.core.mvc.XMLView.create({
                        definition: sXml,
                        id: sPreviewViewId
                    });
                    this._previewViewId = sPreviewViewId;

                    const oPage = oView.getContent()[0];

                    this._preparePreviewNavigation(oView);
                    oApp.addPage(oPage);
                    oApp.to(oPage.getId());
                    navigator.clipboard.writeText(sXml);
                    MessageToast.show("XML copiado para o clipboard!");
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
                    this._destroyDynamicPreview(oApp);
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
            },

            _destroyDynamicPreview: function (oApp) {
                const sDynamicViewId = this._previewViewId;
                const sDynamicPrefix = sDynamicViewId ? sDynamicViewId + "--" : null;

                if (oApp && oApp.getPages && oApp.removePage) {
                    (oApp.getPages() || []).slice().forEach(function (oPage) {
                        const sPageId = oPage && oPage.getId ? oPage.getId() : "";
                        if (sPageId && sDynamicPrefix && sPageId.indexOf(sDynamicPrefix) === 0) {
                            oApp.removePage(oPage);
                            oPage.destroy();
                        }
                    });
                }

                if (sDynamicViewId) {
                    const oOldView = sap.ui.getCore().byId(sDynamicViewId);
                    if (oOldView) {
                        oOldView.destroy();
                    }
                }

                this._previewViewId = null;
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

            _escapeAttribute: function (value) {
                return this._escapeHtml(value == null ? "" : value).replaceAll("`", "&#96;");
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

            _buildItemHtml: function (item, selectedIds) {
                const isSelected = Array.isArray(selectedIds) && selectedIds.includes(item.id);
                const selectedClass = isSelected ? " selected" : "";
                const size = this._estimateItemSize(item);
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

                return '<div class="wfItem' + selectedClass + '" data-id="' + item.id + '" style="left:' + item.x + "px; top:" + item.y + "px; width:" + size.width + 'px; --wf-item-width:' + size.width + 'px;">' + inner + '<div class="wfResizeHandle" data-role="resize"></div></div>';
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

                const selectedIds = this._getSelectedIds();
                const wrapper = document.createElement("div");
                wrapper.innerHTML = this._buildItemHtml(item, selectedIds);
                const nextEl = wrapper.firstElementChild;

                if (!nextEl) {
                    return;
                }

                currentEl.className = nextEl.className;
                currentEl.style.cssText = nextEl.style.cssText;
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
                const selectedIds = this._getSelectedIds();
                const editorStateId = this._editorState && this._editorState.id;

                placeholder.style.display = items.length ? "none" : "flex";
                editor.style.display = "none";
                editor.innerHTML = "";

                items.forEach(function (item) {
                    this._normalizeItemProperties(item);
                    const wrapper = document.createElement("div");
                    wrapper.innerHTML = this._buildItemHtml(item, selectedIds);
                    const el = wrapper.firstElementChild;
                    canvas.appendChild(el);
                }.bind(this));

                this._ensureSelectionBox(canvas);

                if (editorStateId != null) {
                    this._openEditor(editorStateId);
                }

                this._applyCanvasStaticTexts();
                this._fitCanvasToViewport();
                this._bindCanvasEvents();
            },

            _bindCanvasEvents: function () {
                const canvas = document.getElementById("canvas-root");

                if (!canvas) {
                    return;
                }

                canvas.onmousedown = function (event) {
                    if (event.target !== canvas || event.button !== 0) {
                        return;
                    }

                    if (this._clickTimer) {
                        clearTimeout(this._clickTimer);
                        this._clickTimer = null;
                    }

                    if (this._editorState) {
                        this._closeEditor(true);
                    }

                    this._startSelectionBox(event);
                }.bind(this);

                canvas.querySelectorAll(".wfItem").forEach(function (el) {
                    el.onmousedown = null;
                    el.onclick = null;
                    el.ondblclick = null;

                    const resizeHandle = el.querySelector('[data-role="resize"]');
                    if (resizeHandle) {
                        resizeHandle.onmousedown = null;
                        resizeHandle.addEventListener("mousedown", function (event) {
                            event.preventDefault();
                            event.stopPropagation();

                            if (event.button !== 0) {
                                return;
                            }

                            const id = Number(el.dataset.id);

                            if (this._clickTimer) {
                                clearTimeout(this._clickTimer);
                                this._clickTimer = null;
                            }

                            this._startResize(el, id, event.clientX);
                        }.bind(this));
                    }

                    el.addEventListener("mousedown", function (event) {
                        event.stopPropagation();

                        if (event.target.closest('[data-role="resize"]')) {
                            return;
                        }

                        const id = Number(el.dataset.id);
                        const isModifierPressed = this._isMultiSelectModifier(event);

                        if (event.detail === 2) {
                            if (this._clickTimer) {
                                clearTimeout(this._clickTimer);
                                this._clickTimer = null;
                            }

                            this._setSelection([id], id);
                            this._openEditor(id);
                            return;
                        }

                        this._clickTimer = setTimeout(function () {
                            if (this._editorState && this._editorState.id !== id) {
                                this._editorState = null;
                            }
                            if (isModifierPressed) {
                                this._toggleItemSelection(id);
                            } else {
                                this._selectItem(id);
                            }
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

                                if (isModifierPressed) {
                                    this._toggleItemSelection(id);
                                    this._renderCanvas();
                                } else if (!this._getSelectedIds().includes(id)) {
                                    this._selectItem(id);
                                    this._renderCanvas();
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
            },

            _ensureSelectionBox: function (canvas) {
                let selectionBox = canvas.querySelector(".wfSelectionBox");

                if (!selectionBox) {
                    selectionBox = document.createElement("div");
                    selectionBox.className = "wfSelectionBox";
                    selectionBox.style.display = "none";
                    canvas.appendChild(selectionBox);
                }

                return selectionBox;
            },

            _getCanvasPoint: function (event, canvas) {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: event.clientX - rect.left + canvas.scrollLeft,
                    y: event.clientY - rect.top + canvas.scrollTop
                };
            },

            _startSelectionBox: function (event) {
                const canvas = document.getElementById("canvas-root");
                const selectionBox = canvas ? this._ensureSelectionBox(canvas) : null;

                if (!canvas || !selectionBox) {
                    return;
                }

                const origin = this._getCanvasPoint(event, canvas);
                this._selectionBoxState = {
                    additive: this._isMultiSelectModifier(event),
                    anchorX: origin.x,
                    anchorY: origin.y,
                    moved: false,
                    baseSelection: this._getSelectedIds()
                };

                selectionBox.style.display = "block";
                selectionBox.style.left = origin.x + "px";
                selectionBox.style.top = origin.y + "px";
                selectionBox.style.width = "0px";
                selectionBox.style.height = "0px";

                this._boundOnSelectionBoxMove = this._onSelectionBoxMove.bind(this);
                this._boundStopSelectionBox = this._stopSelectionBox.bind(this);

                document.addEventListener("mousemove", this._boundOnSelectionBoxMove);
                document.addEventListener("mouseup", this._boundStopSelectionBox);
            },

            _onSelectionBoxMove: function (event) {
                if (!this._selectionBoxState) {
                    return;
                }

                const canvas = document.getElementById("canvas-root");
                const selectionBox = canvas ? canvas.querySelector(".wfSelectionBox") : null;

                if (!canvas || !selectionBox) {
                    return;
                }

                const point = this._getCanvasPoint(event, canvas);
                const left = Math.min(this._selectionBoxState.anchorX, point.x);
                const top = Math.min(this._selectionBoxState.anchorY, point.y);
                const width = Math.abs(point.x - this._selectionBoxState.anchorX);
                const height = Math.abs(point.y - this._selectionBoxState.anchorY);

                this._selectionBoxState.moved = this._selectionBoxState.moved || width > 4 || height > 4;

                selectionBox.style.left = left + "px";
                selectionBox.style.top = top + "px";
                selectionBox.style.width = width + "px";
                selectionBox.style.height = height + "px";

                if (!this._selectionBoxState.moved) {
                    return;
                }

                const items = this._getModel().getProperty("/items");
                const selectedByBox = items.filter(function (item) {
                    const size = this._estimateItemSize(item);
                    return item.x < left + width
                        && item.x + size.width > left
                        && item.y < top + height
                        && item.y + size.height > top;
                }.bind(this)).map(function (item) {
                    return item.id;
                });

                const nextSelection = this._selectionBoxState.additive
                    ? Array.from(new Set(this._selectionBoxState.baseSelection.concat(selectedByBox)))
                    : selectedByBox;

                this._setSelection(nextSelection, nextSelection[0] || null);
                this._renderCanvas();
            },

            _stopSelectionBox: function () {
                if (!this._selectionBoxState) {
                    return;
                }

                const canvas = document.getElementById("canvas-root");
                const selectionBox = canvas ? canvas.querySelector(".wfSelectionBox") : null;

                if (selectionBox) {
                    selectionBox.style.display = "none";
                }

                if (!this._selectionBoxState.moved && !this._selectionBoxState.additive) {
                    this._clearSelection();
                    this._renderCanvas();
                }

                this._selectionBoxState = null;
                document.removeEventListener("mousemove", this._boundOnSelectionBoxMove);
                document.removeEventListener("mouseup", this._boundStopSelectionBox);
            },

            _copySelectedItems: function () {
                const selectedIds = this._getSelectedIds();
                const items = this._getModel().getProperty("/items").filter(function (item) {
                    return selectedIds.includes(item.id);
                });

                if (!items.length) {
                    return;
                }

                const minX = Math.min.apply(null, items.map(function (item) { return item.x; }));
                const minY = Math.min.apply(null, items.map(function (item) { return item.y; }));
                this._clipboardBaseX = minX;
                this._clipboardBaseY = minY;

                this._copiedItems = items.map(function (item) {
                    const clone = this._cloneItem(item);
                    clone._relativeX = item.x - minX;
                    clone._relativeY = item.y - minY;
                    return clone;
                }.bind(this));
                this._pasteOffset = GRID;
                this._setStatus(this._text("status.componentCopied", [items.length]));
            },

            _pasteCopiedItems: function () {
                if (!this._copiedItems || !this._copiedItems.length) {
                    return;
                }

                const model = this._getModel();
                const items = model.getProperty("/items");
                const newIds = [];

                this._copiedItems.forEach(function (copiedItem) {
                    const clone = this._cloneItem(copiedItem);
                    delete clone._relativeX;
                    delete clone._relativeY;
                    clone.id = this._nextId++;
                    clone.x = this._snap((this._clipboardBaseX || 0) + (copiedItem._relativeX || 0) + this._pasteOffset);
                    clone.y = this._snap((this._clipboardBaseY || 0) + (copiedItem._relativeY || 0) + this._pasteOffset);
                    items.push(this._normalizeItemProperties(clone));
                    newIds.push(clone.id);
                }.bind(this));

                this._pasteOffset += GRID;
                model.setProperty("/items", items);
                this._setSelection(newIds, newIds[0] || null);
                this._editorState = null;
                this._renderCanvas();
                this._setStatus(this._text("status.componentPasted", [newIds.length]));
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
                    this._syncItemTextProperty(item, (statusParts[0] || "").trim() || this._text("comp.status"));
                    item.state = (statusParts[1] || "Information").trim() || "Information";
                    return;
                }

                if (["title", "text", "label", "button", "section"].includes(item.type)) {
                    this._syncItemTextProperty(item, clean);
                } else if (["input", "select", "date"].includes(item.type)) {
                    item.label = clean;
                } else if (item.type === "table") {
                    const parts = clean.split(",").map(function (part) {
                        return part.trim();
                    }).filter(Boolean);
                    item.columns = parts.length ? parts : [this._text("default.table.col1"), this._text("default.table.col2"), this._text("default.table.col3")];
                }
            },

            _buildPropertyFieldHtml: function (property, value) {
                const safeName = this._escapeAttribute(property.name);
                const descriptionText = property.description ? this._text(property.description) : "";
                const description = descriptionText ? ' title="' + this._escapeAttribute(descriptionText) + '"' : "";

                if (property.control === "checkbox") {
                    return [
                        '<label class="wfEditorCheckbox"' + description + '>',
                        '  <input type="checkbox" class="wfEditorProp" data-prop="' + safeName + '"' + (value ? " checked" : "") + " />",
                        '  <span>' + this._escapeHtml(property.name) + "</span>",
                        "</label>"
                    ].join("");
                }

                if (property.control === "select") {
                    return [
                        '<label class="wfEditorField"' + description + '>',
                        '  <span class="wfEditorLabel">' + this._escapeHtml(property.name) + "</span>",
                        '  <select class="wfEditorSelect wfEditorProp" data-prop="' + safeName + '">',
                        (property.enumValues || []).map(function (option) {
                            const selected = String(option) === String(value) ? ' selected="selected"' : "";
                            return '<option value="' + this._escapeAttribute(option) + '"' + selected + ">" + this._escapeHtml(option) + "</option>";
                        }.bind(this)).join(""),
                        "  </select>",
                        "</label>"
                    ].join("");
                }

                if (property.control === "textarea") {
                    return [
                        '<label class="wfEditorField"' + description + '>',
                        '  <span class="wfEditorLabel">' + this._escapeHtml(property.name) + "</span>",
                        '  <textarea class="wfEditorTextarea wfEditorProp" data-prop="' + safeName + '" rows="3">' + this._escapeHtml(value == null ? "" : value) + "</textarea>",
                        "</label>"
                    ].join("");
                }

                return [
                    '<label class="wfEditorField"' + description + '>',
                    '  <span class="wfEditorLabel">' + this._escapeHtml(property.name) + "</span>",
                    '  <input type="' + (property.control === "number" ? "number" : "text") + '" class="wfEditorInput wfEditorProp" data-prop="' + safeName + '" value="' + this._escapeAttribute(value) + '" />',
                    "</label>"
                ].join("");
            },

            _buildEditorHtml: function (item) {
                const meta = this._getTypeMeta(item.type);
                const properties = this._getComponentProperties(item.type);

                return [
                    '<div class="wfEditorHeader">',
                    '  <div class="wfEditorTitleWrap">',
                    '    <div class="wfEditorTitle">' + this._escapeHtml(meta.label) + "</div>",
                    '    <div class="wfEditorSubtitle">#' + item.id + "</div>",
                    "  </div>",
                    '  <button type="button" class="wfEditorIconButton" data-action="save" aria-label="Fechar painel">x</button>',
                    "</div>",
                    '<div class="wfEditorWarning" role="alert">',
                    '  <div class="wfEditorWarningTitle">' + this._escapeHtml(this._text("editor.warning.title")) + "</div>",
                    '  <div class="wfEditorWarningText">' + this._escapeHtml(this._text("editor.warning.text")) + "</div>",
                    "</div>",
                    '<label class="wfEditorField">',
                    '  <span class="wfEditorLabel">Texto do componente</span>',
                    '  <textarea id="canvas-editor-text" class="wfEditorTextarea" rows="3">' + this._escapeHtml(this._getEditableValue(item)) + "</textarea>",
                    "</label>",
                    properties.length ? '<div class="wfEditorSectionTitle">Propriedades UI5</div>' : "",
                    properties.length ? '<div class="wfEditorFields">' + properties.map(function (property) {
                        return this._buildPropertyFieldHtml(property, item.ui5Properties[property.name]);
                    }.bind(this)).join("") + "</div>" : "",
                    '<div class="wfEditorActions">',
                    '  <button type="button" class="wfEditorButton secondary" data-action="cancel">Cancelar</button>',
                    '  <button type="button" class="wfEditorButton primary" data-action="save">Aplicar</button>',
                    "</div>",
                    '<div class="wfEditorHelp">' + this._escapeHtml(this._text("canvas.editorHelp")) + "</div>"
                ].join("");
            },

            _bindEditorEvents: function () {
                const editor = document.getElementById("canvas-editor");
                const editorText = document.getElementById("canvas-editor-text");

                if (!editor) {
                    return;
                }

                editor.onmousedown = function (event) {
                    event.stopPropagation();
                };
                editor.onclick = function (event) {
                    event.stopPropagation();
                };

                if (editorText) {
                    editorText.oninput = function () {
                        this._liveUpdateEditorText();
                    }.bind(this);

                    editorText.onkeydown = function (event) {
                        event.stopPropagation();

                        if (event.key === "Escape") {
                            event.preventDefault();
                            this._closeEditor(false);
                            return;
                        }

                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            this._closeEditor(true);
                        }
                    }.bind(this);
                }

                editor.querySelectorAll(".wfEditorProp").forEach(function (field) {
                    const handler = function (event) {
                        this._liveUpdateProperty(event.target);
                    }.bind(this);

                    field.oninput = handler;
                    field.onchange = handler;
                    field.onkeydown = function (event) {
                        event.stopPropagation();

                        if (event.key === "Escape") {
                            event.preventDefault();
                            this._closeEditor(false);
                            return;
                        }

                        if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            this._closeEditor(true);
                        }
                    }.bind(this);
                }.bind(this));

                editor.querySelectorAll("[data-action]").forEach(function (button) {
                    button.onclick = function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        this._closeEditor(button.dataset.action !== "cancel");
                    }.bind(this);
                }.bind(this));
            },

            _setUi5PropertyValue: function (item, propertyName, rawValue) {
                const property = this._getComponentProperties(item.type).find(function (entry) {
                    return entry.name === propertyName;
                });

                if (!property) {
                    return;
                }

                this._normalizeItemProperties(item);

                if (property.control === "checkbox") {
                    item.ui5Properties[propertyName] = Boolean(rawValue);
                    return;
                }

                if (property.control === "number") {
                    const parsedValue = parseInt(rawValue, 10);
                    item.ui5Properties[propertyName] = Number.isNaN(parsedValue) ? property.defaultValue : parsedValue;
                    return;
                }

                item.ui5Properties[propertyName] = rawValue == null ? "" : String(rawValue);

                if (propertyName === "text") {
                    this._syncItemTextProperty(item, item.ui5Properties[propertyName]);
                }
            },

            _openEditor: function (id) {
                const canvas = document.getElementById("canvas-root");
                const editor = document.getElementById("canvas-editor");
                if (!canvas || !editor) {
                    return;
                }

                const el = canvas.querySelector('.wfItem[data-id="' + id + '"]');
                const item = this._getModel().getProperty("/items").find(function (entry) {
                    return entry.id === id;
                });

                if (!el || !item) {
                    return;
                }

                this._selectItem(id);
                this._normalizeItemProperties(item);

                this._editorState = {
                    id: id,
                    originalItem: this._cloneItem(item)
                };

                editor.innerHTML = this._buildEditorHtml(item);
                editor.style.left = Math.max(canvas.scrollLeft + 12, Math.min(el.offsetLeft + el.offsetWidth + 16, canvas.scrollLeft + canvas.clientWidth - 356)) + "px";
                editor.style.top = Math.max(canvas.scrollTop + 12, Math.min(el.offsetTop, canvas.scrollTop + canvas.clientHeight - 420)) + "px";
                editor.style.display = "block";
                this._bindEditorEvents();

                const editorText = document.getElementById("canvas-editor-text");
                if (editorText) {
                    editorText.focus();
                    editorText.select();
                }
            },

            _liveUpdateEditorText: function () {
                if (!this._editorState) {
                    return;
                }

                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._editorState.id;
                }.bind(this));
                const editorText = document.getElementById("canvas-editor-text");

                if (!item || !editorText) {
                    return;
                }

                this._setEditableValue(item, editorText.value);
                this._getModel().setProperty("/items", items);
                this._refreshItemPreview(item);
            },

            _liveUpdateProperty: function (field) {
                if (!this._editorState || !field) {
                    return;
                }

                const propertyName = field.dataset.prop;
                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._editorState.id;
                }.bind(this));

                if (!item || !propertyName) {
                    return;
                }

                this._setUi5PropertyValue(item, propertyName, field.type === "checkbox" ? field.checked : field.value);
                this._getModel().setProperty("/items", items);
                this._refreshItemPreview(item);
            },

            _closeEditor: function (save) {
                if (!this._editorState) {
                    return;
                }

                const items = this._getModel().getProperty("/items");
                const itemIndex = items.findIndex(function (entry) {
                    return entry.id === this._editorState.id;
                }.bind(this));

                if (!save && itemIndex >= 0) {
                    items[itemIndex] = this._cloneItem(this._editorState.originalItem);
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
                const items = this._getModel().getProperty("/items");
                const selectedIds = this._getSelectedIds();
                const dragIds = selectedIds.includes(id) ? selectedIds : [id];
                const originItems = items.filter(function (entry) {
                    return dragIds.includes(entry.id);
                }).map(function (entry) {
                    return {
                        id: entry.id,
                        x: entry.x,
                        y: entry.y
                    };
                });

                if (!canvas || !el || !originItems.length) {
                    return;
                }

                this._setSelection(dragIds, id);

                this._dragState = {
                    id: id,
                    ids: dragIds,
                    lastMouseX: mouseX,
                    lastMouseY: mouseY,
                    originItems: originItems
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
                if (!canvas) {
                    return;
                }

                const rect = canvas.getBoundingClientRect();
                const items = this._getModel().getProperty("/items");

                if (event.clientY > rect.bottom - 40) {
                    canvas.scrollTop = Math.min(canvas.scrollTop + 24, canvas.scrollHeight);
                } else if (event.clientY < rect.top + 40) {
                    canvas.scrollTop = Math.max(canvas.scrollTop - 24, 0);
                }

                if (event.clientX > rect.right - 40) {
                    canvas.scrollLeft = Math.min(canvas.scrollLeft + 24, canvas.scrollWidth);
                } else if (event.clientX < rect.left + 40) {
                    canvas.scrollLeft = Math.max(canvas.scrollLeft - 24, 0);
                }

                const deltaX = this._snapDelta(event.clientX - this._dragState.lastMouseX);
                const deltaY = this._snapDelta(event.clientY - this._dragState.lastMouseY);
                const maxCanvasY = Math.max(canvas.clientHeight, canvas.scrollHeight + 120) - 40;

                if (!deltaX && !deltaY) {
                    return;
                }

                this._dragState.originItems.forEach(function (originItem) {
                    const currentItem = items.find(function (entry) {
                        return entry.id === originItem.id;
                    });

                    if (!currentItem) {
                        return;
                    }

                    currentItem.x = Math.max(0, Math.min(currentItem.x + deltaX, canvas.clientWidth - 40));
                    currentItem.y = Math.max(0, Math.min(currentItem.y + deltaY, maxCanvasY));
                });

                this._dragState.lastMouseX = event.clientX;
                this._dragState.lastMouseY = event.clientY;

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
            },

            _startResize: function (el, id, mouseX) {
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

                this._normalizeItemProperties(item);
                this._selectItem(id);

                this._resizeState = {
                    id: id,
                    startX: mouseX,
                    startWidth: this._estimateItemSize(item).width
                };

                this._boundOnResize = this._onResize.bind(this);
                this._boundStopResize = this._stopResize.bind(this);

                document.addEventListener("mousemove", this._boundOnResize);
                document.addEventListener("mouseup", this._boundStopResize);
            },

            _onResize: function (event) {
                if (!this._resizeState) {
                    return;
                }

                const canvas = document.getElementById("canvas-root");
                const rect = canvas.getBoundingClientRect();
                const items = this._getModel().getProperty("/items");
                const item = items.find(function (entry) {
                    return entry.id === this._resizeState.id;
                }.bind(this));

                if (!item) {
                    return;
                }

                if (event.clientX > rect.right - 40) {
                    canvas.scrollLeft = Math.min(canvas.scrollLeft + 24, canvas.scrollWidth);
                } else if (event.clientX < rect.left + 40) {
                    canvas.scrollLeft = Math.max(canvas.scrollLeft - 24, 0);
                }

                const deltaX = event.clientX - this._resizeState.startX;
                const maxWidth = Math.max(this._getMinItemWidth(item.type), canvas.clientWidth - item.x - 16);
                const nextWidth = Math.min(maxWidth, Math.max(this._getMinItemWidth(item.type), this._snap(this._resizeState.startWidth + deltaX)));

                this._setItemWidth(item, nextWidth, canvas);
                this._getModel().setProperty("/items", items);
                this._renderCanvas();
            },

            _stopResize: function () {
                if (this._resizeState) {
                    this._setStatus(this._text("status.componentUpdated"));
                }

                this._resizeState = null;
                document.removeEventListener("mousemove", this._boundOnResize);
                document.removeEventListener("mouseup", this._boundStopResize);
            }
        });
    });
