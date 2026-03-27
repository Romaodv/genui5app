sap.ui.define([], function () {
    "use strict";

/**
 * componentProperties.fallback.js
 *
 * Propriedades manuais curadas para cada tipo do wireframe.
 * Use como fallback se o api.json não estiver acessível,
 * ou como base de merge com o resultado do extractor.
 *
 * Estrutura de cada propriedade:
 * {
 *   name:         string       — nome da prop no XML (ex: "value", "type")
 *   type:         string       — tipo UI5 (string, boolean, int, enum)
 *   control:      string       — controle no painel: "text"|"textarea"|"checkbox"|"number"|"select"
 *   defaultValue: any          — valor padrão
 *   enumValues:   string[]     — valores possíveis se control === "select"
 *   description:  string       — tooltip de ajuda no painel
 * }
 */

const COMPONENT_PROPERTIES = {

    // ── sap.m.Title ──────────────────────────────────────────────────────────
    title: {
        ui5Class: "sap.m.Title",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "text",            type: "string",  control: "text",     defaultValue: "",        description: "prop.title.text.description" },
            { name: "level",           type: "enum",    control: "select",   defaultValue: "Auto",    description: "prop.title.level.description",
              enumValues: ["Auto","H1","H2","H3","H4","H5","H6"] },
            { name: "titleStyle",      type: "enum",    control: "select",   defaultValue: "Auto",    description: "prop.title.titleStyle.description",
              enumValues: ["Auto","H1","H2","H3","H4","H5","H6"] },
            { name: "wrapping",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.title.wrapping.description" },
            { name: "textAlign",       type: "enum",    control: "select",   defaultValue: "Initial",
              enumValues: ["Begin","Center","End","Left","Right","Initial"], description: "prop.title.textAlign.description" }
            
        ],
    },

    // ── sap.m.Text ───────────────────────────────────────────────────────────
    text: {
        ui5Class: "sap.m.Text",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "text",            type: "string",  control: "textarea", defaultValue: "",        description: "prop.text.text.description" },
            { name: "maxLines",        type: "int",     control: "number",   defaultValue: 0,         description: "prop.text.maxLines.description" },
            { name: "wrapping",        type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.text.wrapping.description" },
            { name: "textAlign",       type: "enum",    control: "select",   defaultValue: "Begin",
              enumValues: ["Begin","Center","End","Left","Right","Initial"], description: "prop.text.textAlign.description" }
        ],
    },

    // ── sap.m.Label ──────────────────────────────────────────────────────────
    label: {
        ui5Class: "sap.m.Label",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "text",            type: "string",  control: "text",     defaultValue: "",        description: "prop.label.text.description" },
            { name: "required",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.label.required.description" },
            { name: "displayOnly",     type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.label.displayOnly.description" },
            { name: "textAlign",       type: "enum",    control: "select",   defaultValue: "Begin",
              enumValues: ["Begin","Center","End","Left","Right","Initial"], description: "prop.label.textAlign.description" }
        ],
    },

    // ── sap.m.Input ──────────────────────────────────────────────────────────
    input: {
        ui5Class: "sap.m.Input",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "value",           type: "string",  control: "text",     defaultValue: "",        description: "prop.input.value.description" },
            { name: "placeholder",     type: "string",  control: "text",     defaultValue: "",        description: "prop.input.placeholder.description" },
            { name: "type",            type: "enum",    control: "select",   defaultValue: "Text",
              enumValues: ["Text","Number","Email","Password","Tel","Url","Date","Time","Month","Week","Search"], description: "prop.input.type.description" },
            { name: "maxLength",       type: "int",     control: "number",   defaultValue: 0,         description: "prop.input.maxLength.description" },
            { name: "editable",        type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.input.editable.description" },
            { name: "enabled",         type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.input.enabled.description" },
            { name: "required",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.input.required.description" },
            { name: "valueState",      type: "enum",    control: "select",   defaultValue: "None",
              enumValues: ["None","Error","Warning","Success","Information"], description: "prop.input.valueState.description" },
            { name: "valueStateText",  type: "string",  control: "text",     defaultValue: "",        description: "prop.input.valueStateText.description" },
            { name: "showSuggestion",  type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.input.showSuggestion.description" },
        ],
    },

    // ── sap.m.Select ─────────────────────────────────────────────────────────
    select: {
        ui5Class: "sap.m.Select",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "selectedKey",     type: "string",  control: "text",     defaultValue: "",        description: "prop.select.selectedKey.description" },
            { name: "forceSelection",  type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.select.forceSelection.description" },
            { name: "enabled",         type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.select.enabled.description" },
            { name: "editable",        type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.select.editable.description" },
            { name: "required",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.select.required.description" },
            { name: "valueState",      type: "enum",    control: "select",   defaultValue: "None",
              enumValues: ["None","Error","Warning","Success","Information"], description: "prop.select.valueState.description" },
            { name: "placeholder",     type: "string",  control: "text",     defaultValue: "",        description: "prop.select.placeholder.description" },
            { name: "autoAdjustWidth", type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.select.autoAdjustWidth.description" },
        ],
    },

    // ── sap.m.DatePicker ─────────────────────────────────────────────────────
    date: {
        ui5Class: "sap.m.DatePicker",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "value",           type: "string",  control: "text",     defaultValue: "",        description: "prop.date.value.description" },
            { name: "dateValue",       type: "string",  control: "text",     defaultValue: "",        description: "prop.date.dateValue.description" },
            { name: "displayFormat",   type: "string",  control: "text",     defaultValue: "",        description: "prop.date.displayFormat.description" },
            { name: "valueFormat",     type: "string",  control: "text",     defaultValue: "",        description: "prop.date.valueFormat.description" },
            { name: "placeholder",     type: "string",  control: "text",     defaultValue: "",        description: "prop.date.placeholder.description" },
            { name: "enabled",         type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.date.enabled.description" },
            { name: "editable",        type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.date.editable.description" },
            { name: "required",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.date.required.description" },
            { name: "valueState",      type: "enum",    control: "select",   defaultValue: "None",
              enumValues: ["None","Error","Warning","Success","Information"], description: "prop.date.valueState.description" },
            { name: "minDate",         type: "string",  control: "text",     defaultValue: "",        description: "prop.date.minDate.description" },
            { name: "maxDate",         type: "string",  control: "text",     defaultValue: "",        description: "prop.date.maxDate.description" }
        ],
    },

    // ── sap.m.Button ─────────────────────────────────────────────────────────
    button: {
        ui5Class: "sap.m.Button",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "text",            type: "string",  control: "text",     defaultValue: "",        description: "prop.button.text.description" },
            { name: "type",            type: "enum",    control: "select",   defaultValue: "Default",
              enumValues: ["Default","Back","Accept","Reject","Emphasized","Ghost","Neutral","Critical","Negative","Success","Attention","Transparent","Unstyled"], description: "prop.button.type.description" },
            { name: "icon",            type: "string",  control: "text",     defaultValue: "",        description: "prop.button.icon.description" },
            { name: "iconFirst",       type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.button.iconFirst.description" },
            { name: "enabled",         type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.button.enabled.description" },
            { name: "press",           type: "string",  control: "text",     defaultValue: "",        description: "prop.button.press.description" },
        ],
    },

    // ── sap.m.Table ──────────────────────────────────────────────────────────
    table: {
        ui5Class: "sap.m.Table",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "noDataText",      type: "string",  control: "text",     defaultValue: "",        description: "prop.table.noDataText.description" },
            { name: "mode",            type: "enum",    control: "select",   defaultValue: "None",
              enumValues: ["None","SingleSelect","SingleSelectLeft","SingleSelectMaster","MultiSelect","Delete"], description: "prop.table.mode.description" },
            { name: "inset",           type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.table.inset.description" },
            { name: "alternateRowColors", type: "boolean", control: "checkbox", defaultValue: false,  description: "prop.table.alternateRowColors.description" },
            { name: "sticky",          type: "string",  control: "text",     defaultValue: "",        description: "prop.table.sticky.description" },
            { name: "growing",         type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.table.growing.description" },
            { name: "growingThreshold",type: "int",     control: "number",   defaultValue: 20,        description: "prop.table.growingThreshold.description" },
            { name: "showSeparators", type: "enum",    control: "select",   defaultValue: "All",
              enumValues: ["All","Inner","Outer","None"], description: "prop.table.showSeparators.description" },
        ],
    },

    // ── sap.m.ObjectStatus ───────────────────────────────────────────────────
    status: {
        ui5Class: "sap.m.ObjectStatus",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "text",            type: "string",  control: "text",     defaultValue: "",        description: "prop.status.text.description" },
            { name: "title",           type: "string",  control: "text",     defaultValue: "",        description: "prop.status.title.description" },
            { name: "state",           type: "enum",    control: "select",   defaultValue: "None",
              enumValues: ["None","Error","Warning","Success","Information"], description: "prop.status.state.description" },
            { name: "icon",            type: "string",  control: "text",     defaultValue: "",        description: "prop.status.icon.description" },
            { name: "active",          type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.status.active.description" },
            { name: "inverted",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.status.inverted.description" },
        ],
    },

    // ── sap.m.Toolbar ────────────────────────────────────────────────────────
    toolbar: {
        ui5Class: "sap.m.Toolbar",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "design",          type: "enum",    control: "select",   defaultValue: "Auto",
              enumValues: ["Auto","Transparent","Solid","Info"], description: "prop.toolbar.design.description" },
            { name: "height",          type: "string",  control: "text",     defaultValue: "",        description: "prop.toolbar.height.description" },
            { name: "activeDesign",    type: "enum",    control: "select",   defaultValue: "HoverBar",
              enumValues: ["HoverBar","Active"], description: "prop.toolbar.activeDesign.description" },
        ],
    },

    // ── sap.ui.layout.form.SimpleForm ────────────────────────────────────────
    form: {
        ui5Class: "sap.ui.layout.form.SimpleForm",
        properties: [
            { name: "width",           type: "string",  control: "text",     defaultValue: "",        description: "prop.common.width.description" },
            { name: "title",           type: "string",  control: "text",     defaultValue: "",        description: "prop.form.title.description" },
            { name: "editable",        type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.form.editable.description" },
            { name: "layout",          type: "enum",    control: "select",   defaultValue: "ResponsiveGridLayout",
              enumValues: ["ResponsiveGridLayout","GridLayout","ColumnLayout"], description: "prop.form.layout.description" },
            { name: "labelSpanL",      type: "int",     control: "number",   defaultValue: 4,         description: "prop.form.labelSpanL.description" },
            { name: "labelSpanM",      type: "int",     control: "number",   defaultValue: 2,         description: "prop.form.labelSpanM.description" },
            { name: "labelSpanS",      type: "int",     control: "number",   defaultValue: 12,        description: "prop.form.labelSpanS.description" },
            { name: "columnsL",        type: "int",     control: "number",   defaultValue: 2,         description: "prop.form.columnsL.description" },
            { name: "columnsM",        type: "int",     control: "number",   defaultValue: 1,         description: "prop.form.columnsM.description" },
            { name: "maxContainerCols",type: "int",     control: "number",   defaultValue: 2,         description: "prop.form.maxContainerCols.description" },
        ],
    },

    // ── sap.uxap.ObjectPageSection ───────────────────────────────────────────
    section: {
        ui5Class: "sap.uxap.ObjectPageSection",
        properties: [
            { name: "title",           type: "string",  control: "text",     defaultValue: "",        description: "prop.section.title.description" },
            { name: "titleUppercase",  type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.section.titleUppercase.description" },
            { name: "showTitle",       type: "boolean", control: "checkbox", defaultValue: true,      description: "prop.section.showTitle.description" },
        ],
    },

    // ── sap.uxap.ObjectPageHeader ────────────────────────────────────────────
    objectHeader: {
        ui5Class: "sap.uxap.ObjectPageHeader",
        properties: [
            { name: "objectTitle",     type: "string",  control: "text",     defaultValue: "",        description: "prop.objectHeader.objectTitle.description" },
            { name: "objectSubtitle",  type: "string",  control: "text",     defaultValue: "",        description: "prop.objectHeader.objectSubtitle.description" },
            { name: "showTitleSelector", type: "boolean", control: "checkbox", defaultValue: false,   description: "prop.objectHeader.showTitleSelector.description" },
            { name: "showMarkers",     type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.objectHeader.showMarkers.description" },
            { name: "markFavorite",    type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.objectHeader.markFavorite.description" },
            { name: "markLocked",      type: "boolean", control: "checkbox", defaultValue: false,     description: "prop.objectHeader.markLocked.description" },
            { name: "objectImageURI",  type: "string",  control: "text",     defaultValue: "",        description: "prop.objectHeader.objectImageURI.description" },
            { name: "objectImageShape", type: "enum",   control: "select",   defaultValue: "Square",
              enumValues: ["Square","Circle"], description: "prop.objectHeader.objectImageShape.description" },
        ],
    },
};

return COMPONENT_PROPERTIES;
});
