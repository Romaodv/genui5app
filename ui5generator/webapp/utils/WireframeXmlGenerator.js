/**
 * WireframeXmlGenerator.js - v3
 *
 * Converts wireframe items into SAPUI5 XML.
 */
sap.ui.define([], function () {
    "use strict";

    // Constants
    const ROW_THRESHOLD    = 44;   // px - items with |delta y| <= this stay on the same row
    const LABEL_MAX_DX     = 220;  // px - maximum horizontal distance from label to field
    const FORM_FIELD_TYPES = new Set(["input", "select", "date"]);
    const INLINE_TYPES     = new Set(["title", "text", "label", "status", "button", "toolbar", "table", "form", "separator", "link", "kpi", "badge", "messageStrip"]);

    const NS_MAP = {
        objectHeader: ["uxap"],
        section:      ["uxap"],
        form:         ["f"],
        input:        ["f"],
        select:       ["f"],
        date:         ["f"],
        table:        [],
        toolbar:      [],
        title:        [],
        text:         [],
        label:        [],
        button:       [],
        status:       [],
    };

    const XMLNS = {
        mvc:  'xmlns:mvc="sap.ui.core.mvc"',
        m:    'xmlns="sap.m"',
        core: 'xmlns:core="sap.ui.core"',
        f:    'xmlns:f="sap.ui.layout.form"',
        l:    'xmlns:l="sap.ui.layout"',
        uxap: 'xmlns:uxap="sap.uxap"',
    };

    var WireframeXmlGenerator = function () {};

    /**
     * Entry point.
     * @param {Array}  items
     * @param {Object} [opts]  { controllerName, patternHint }
     * @returns {{ xml, pattern, namespaces, meta }}
     */
    WireframeXmlGenerator.prototype.generate = function (items, opts) {
        opts = opts || {};
        if (!items || !items.length) {
            return { xml: "", pattern: "empty", namespaces: new Set(), meta: {} };
        }

        var sorted   = this._sort(items);
        var pattern  = opts.patternHint || this._detectPattern(sorted);
        var ns       = this._collectNs(sorted);
        var ctrlName = opts.controllerName || "ui5generator.controller.XmlPreview";

        var lines = [];
        this._header(lines, ns, ctrlName);

        switch (pattern) {
            case "objectPage":  this._genObjectPage(lines, sorted);      break;
            case "listReport":  this._genListReport(lines, sorted);      break;
            default:            this._genSimplePage(lines, sorted, pattern);
        }

        lines.push("</mvc:View>");

        return {
            xml:        lines.join("\n"),
            pattern:    pattern,
            namespaces: ns,
            meta:       this._meta(sorted, pattern, ns),
        };
    };
    // Group items by layout

    /**
     * Groups items into slots: each section consumes the items below it
     * until the next section. Items above the first section go into
     * a "header" slot. No item appears in two slots.
     *
     * Returns:
     *   {
     *     header:    { structural: [...], content: [...] },
     *     sections:  [ { section, formFields, labels, buttons, others } ],
     *     orphans:   [ items without a section above them ],
     *   }
     */
    WireframeXmlGenerator.prototype._buildSlots = function (items) {
        var sorted   = this._sort(items);
        var sections = sorted.filter(function (i) { return i.type === "section"; });

        // Track items that have already been used
        var consumed = new Set();

        // Items above the first section go into the header
        var firstSectionY = sections.length ? sections[0].y : Infinity;

        var headerStructural = sorted.filter(function (i) {
            return (i.type === "objectHeader" || i.type === "toolbar" || i.type === "title")
                && i.y < firstSectionY;
        });
        headerStructural.forEach(function (i) { consumed.add(i.id); });

        // Items assigned to each section
        var sectionSlots = sections.map(function (sec, idx) {
            consumed.add(sec.id);
            var yMin = sec.y;
            var yMax = sections[idx + 1] ? sections[idx + 1].y : Infinity;

            var slot = sorted.filter(function (i) {
                return !consumed.has(i.id) && i.y > yMin && i.y < yMax;
            });
            slot.forEach(function (i) { consumed.add(i.id); });

            var formLabels = slot.filter(function (i) { return i.type === "label"; });
            var formFields = slot.filter(function (i) { return FORM_FIELD_TYPES.has(i.type); });
            var buttons    = slot.filter(function (i) { return i.type === "button"; });
            var others     = slot.filter(function (i) {
                return !FORM_FIELD_TYPES.has(i.type)
                    && i.type !== "button"
                    && i.type !== "label";
            });

            // Match labels to fields
            var fieldsWithLabels = this._attachLabels(formFields, formLabels);

            return { section: sec, fields: fieldsWithLabels, buttons: buttons, others: others };
        }, this);

        // Remaining items without a section
        var orphans = sorted.filter(function (i) { return !consumed.has(i.id); });

        return {
            header:   headerStructural,
            sections: sectionSlots,
            orphans:  orphans,
        };
    };
    // Build an ObjectPage

    WireframeXmlGenerator.prototype._genObjectPage = function (lines, items) {
        var slots      = this._buildSlots(items);
        var headerItem = items.find(function (i) { return i.type === "objectHeader"; });
        var titleItem  = items.find(function (i) { return i.type === "title"; });
        var toolbarItem= slots.header.find(function (i) { return i.type === "toolbar"; });

        // Page title
        var d = this._data(headerItem);
        var pageTitle = d.objectTitle || d.title || (titleItem ? this._data(titleItem).text : "") || "";

        lines.push('    <Page');
        if (pageTitle) lines.push('        title="' + this._esc(pageTitle) + '"');
        lines.push('        showNavButton="true"');
        lines.push('        navButtonPress=".onNavButtonPress"');
        lines.push('        enableScrolling="false">');
        lines.push('        <content>');

        lines.push('            <uxap:ObjectPageLayout');
        lines.push('                id="objectPageLayout"');
        lines.push('                showTitleInHeaderContent="true"');
        lines.push('                alwaysShowContentHeader="false">');

        // Header title
        lines.push('                <uxap:headerTitle>');
        if (headerItem) {
            lines.push('                    <uxap:ObjectPageHeader');
            lines.push('                        objectTitle="' + this._esc(d.objectTitle || d.title || "Objeto") + '"');
            if (d.objectSubtitle || d.sub) lines.push('                        objectSubtitle="' + this._esc(d.objectSubtitle || d.sub) + '"');
            if (d.objectImageURI) lines.push('                        objectImageURI="' + this._esc(d.objectImageURI) + '"');
            lines.push('                        >');
            if (toolbarItem) {
                lines.push('                        <uxap:actions>');
                this._objHeaderActions(lines, toolbarItem, "                            ");
                lines.push('                        </uxap:actions>');
            }
            lines.push('                    </uxap:ObjectPageHeader>');
        } else {
            lines.push('                    <uxap:ObjectPageHeader objectTitle="Objeto" />');
        }
        lines.push('                </uxap:headerTitle>');

        // Header content
        var attrs = d.attrs || d.attributes || [];
        if (attrs.length) {
            lines.push('                <uxap:headerContent>');
            lines.push('                    <VBox>');
            attrs.forEach(function (a) {
                var t = "", v = "";
                if (typeof a === "object") { t = a.l || a.title || ""; v = a.v || a.text || ""; }
                else { var p = String(a).split(":"); t = p[0].trim(); v = p.slice(1).join(":").trim(); }
                lines.push('                        <ObjectAttribute title="' + this._esc(t) + '" text="' + this._esc(v) + '" />');
            }, this);
            lines.push('                    </VBox>');
            lines.push('                </uxap:headerContent>');
        }

        // Sections
        lines.push('                <uxap:sections>');

        if (slots.sections.length) {
            slots.sections.forEach(function (slot) {
                var sd = this._data(slot.section);
                var title = sd.title || sd.text || "Section";
                lines.push('                    <uxap:ObjectPageSection');
                lines.push('                        title="' + this._esc(title) + '"');
                lines.push('                        titleUppercase="false">');
                lines.push('                        <uxap:subSections>');
                lines.push('                            <uxap:ObjectPageSubSection title="">');
                lines.push('                                <uxap:blocks>');

                // Form fields
                if (slot.fields.length) {
                    this._simpleForm(lines, slot.fields, slot.buttons, "                                    ");
                } else if (slot.buttons.length) {
                    slot.buttons.forEach(function (b) { this._ctrl(lines, b, "                                    "); }, this);
                }

                // Other controls
                slot.others.forEach(function (item) {
                    this._ctrl(lines, item, "                                    ");
                }, this);

                lines.push('                                </uxap:blocks>');
                lines.push('                            </uxap:ObjectPageSubSection>');
                lines.push('                        </uxap:subSections>');
                lines.push('                    </uxap:ObjectPageSection>');
            }, this);
        } else {
            // Fallback when there are no sections
            var allContent = slots.orphans.filter(function (i) {
                return i.type !== "objectHeader" && i.type !== "toolbar" && i.type !== "title";
            });
            lines.push('                    <uxap:ObjectPageSection title="Detalhes" titleUppercase="false">');
            lines.push('                        <uxap:subSections>');
            lines.push('                            <uxap:ObjectPageSubSection title="">');
            lines.push('                                <uxap:blocks>');
            this._mixedContent(lines, allContent, "                                    ");
            lines.push('                                </uxap:blocks>');
            lines.push('                            </uxap:ObjectPageSubSection>');
            lines.push('                        </uxap:subSections>');
            lines.push('                    </uxap:ObjectPageSection>');
        }

        lines.push('                </uxap:sections>');
        lines.push('            </uxap:ObjectPageLayout>');
        lines.push('        </content>');
        lines.push('    </Page>');
    };
    // Build a List Report

    WireframeXmlGenerator.prototype._genListReport = function (lines, items) {
        var toolbarItem  = items.find(function (i) { return i.type === "toolbar"; });
        var titleItem    = items.find(function (i) { return i.type === "title"; });
        var tableItems   = items.filter(function (i) { return i.type === "table"; });
        var tableY       = tableItems.length ? tableItems[0].y : Infinity;
        var filterFields = items.filter(function (i) { return FORM_FIELD_TYPES.has(i.type) && i.y < tableY; });
        var filterLabels = items.filter(function (i) { return i.type === "label" && i.y < tableY; });
        var searchBtns   = items.filter(function (i) { return i.type === "button" && i.y < tableY; });

        var pageTitle = toolbarItem ? (this._data(toolbarItem).title || "") : "";
        if (!pageTitle && titleItem) pageTitle = this._data(titleItem).text || "";
        if (!pageTitle) pageTitle = "Listagem";

        lines.push('    <Page');
        lines.push('        title="' + this._esc(pageTitle) + '"');
        lines.push('        showNavButton="false">');

        // Toolbar actions
        var actionBtns = items.filter(function (i) { return i.type === "button" && i.y < (filterFields.length ? filterFields[0].y : tableY); });
        if (toolbarItem || actionBtns.length) {
            lines.push('        <subHeader>');
            lines.push('            <Toolbar>');
            if (toolbarItem) this._toolbarBtns(lines, toolbarItem, "                ");
            lines.push('                <ToolbarSpacer />');
            lines.push('            </Toolbar>');
            lines.push('        </subHeader>');
        }

        lines.push('        <content>');
        lines.push('            <VBox class="sapUiSmallMargin">');

        // Filters
        if (filterFields.length) {
            var fieldsWithLabels = this._attachLabels(filterFields, filterLabels);
            lines.push('                <f:SimpleForm');
            lines.push('                    editable="true"');
            lines.push('                    layout="ColumnLayout"');
            lines.push('                    columnsL="4" columnsM="2"');
            lines.push('                    labelSpanL="12" labelSpanM="12" labelSpanS="12">');
            lines.push('                    <f:content>');
            fieldsWithLabels.forEach(function (f) { this._formField(lines, f, "                        "); }, this);
            lines.push('                    </f:content>');
            lines.push('                </f:SimpleForm>');

            if (searchBtns.length) {
                lines.push('                <HBox>');
                searchBtns.forEach(function (b) { this._ctrl(lines, b, "                    "); }, this);
                lines.push('                </HBox>');
            }
        }

        tableItems.forEach(function (t) { this._table(lines, t, "                "); }, this);

        lines.push('            </VBox>');
        lines.push('        </content>');
        lines.push('    </Page>');
    };
    // Build a simple page

    WireframeXmlGenerator.prototype._genSimplePage = function (lines, items, pattern) {
        var titleItem   = items.find(function (i) { return i.type === "title"; });
        var toolbarItem = items.find(function (i) { return i.type === "toolbar"; });
        var pageTitle   = titleItem ? (this._data(titleItem).text || "Tela") : "";
        if (!pageTitle && toolbarItem) pageTitle = this._data(toolbarItem).title || "";
        if (!pageTitle) pageTitle = "Tela";

        lines.push('    <Page');
        lines.push('        title="' + this._esc(pageTitle) + '"');
        lines.push('        showNavButton="true"');
        lines.push('        navButtonPress=".onNavButtonPress">');

        // Footer buttons
        var footerBtns = items.filter(function (i) { return i.type === "button" && this._data(i).emph; }, this);
        if (footerBtns.length) {
            lines.push('        <footer>');
            lines.push('            <OverflowToolbar>');
            lines.push('                <ToolbarSpacer />');
            footerBtns.forEach(function (b) { this._ctrl(lines, b, "                "); }, this);
            lines.push('            </OverflowToolbar>');
            lines.push('        </footer>');
        }

        lines.push('        <content>');
        lines.push('            <VBox class="sapUiSmallMargin">');

        // Skip the page title and footer buttons here
        var footerIds = new Set(footerBtns.map(function (b) { return b.id; }));
        var content = items.filter(function (i) {
            return i.type !== "title" && !footerIds.has(i.id);
        });
        this._mixedContent(lines, content, "                ");

        lines.push('            </VBox>');
        lines.push('        </content>');
        lines.push('    </Page>');
    };
    // Render mixed content

    WireframeXmlGenerator.prototype._mixedContent = function (lines, items, indent) {
        var formFields = items.filter(function (i) { return FORM_FIELD_TYPES.has(i.type); });
        var labels     = items.filter(function (i) { return i.type === "label"; });
        var buttons    = items.filter(function (i) { return i.type === "button"; });

        // Items rendered inside the form should not be rendered twice
        var inFormIds = new Set();
        formFields.forEach(function (f) { inFormIds.add(f.id); });

        // Paired labels are rendered inside the form
        var fieldsWithLabels = this._attachLabels(formFields, labels);
        var usedLabelIds = new Set();
        fieldsWithLabels.forEach(function (f) { if (f._labelId) usedLabelIds.add(f._labelId); });

        // Non-emphasized buttons stay with the form when fields exist
        var inFormBtns = [];
        var standalone = [];
        buttons.forEach(function (b) {
            if (formFields.length && !this._data(b).emph) inFormBtns.push(b);
            else standalone.push(b);
        }, this);
        inFormBtns.forEach(function (b) { inFormIds.add(b.id); });

        // Render the remaining items in order
        var sorted = this._sort(items);
        var formRendered = false;

        sorted.forEach(function (item) {
            if (usedLabelIds.has(item.id) || inFormIds.has(item.id)) return;
            if (FORM_FIELD_TYPES.has(item.type)) return; // Already rendered in the form

            // Insert the form near the first field
            if (!formRendered && formFields.length && item.y > formFields[0].y) {
                this._simpleForm(lines, fieldsWithLabels, inFormBtns, indent);
                formRendered = true;
            }

            this._ctrl(lines, item, indent);
        }, this);

        // Render the form at the end if needed
        if (!formRendered && formFields.length) {
            this._simpleForm(lines, fieldsWithLabels, inFormBtns, indent);
        }

        // Render remaining standalone buttons
        standalone.forEach(function (b) {
            if (!inFormIds.has(b.id)) this._ctrl(lines, b, indent);
        }, this);
    };
    // Render a SimpleForm

    WireframeXmlGenerator.prototype._simpleForm = function (lines, fields, buttons, indent, formData) {
        var d = formData || {};
        lines.push(indent + '<f:SimpleForm');
        lines.push(indent + '    editable="' + (d.editable === false ? "false" : "true") + '"');
        lines.push(indent + '    layout="ColumnLayout"');
        lines.push(indent + '    columnsL="' + (d.columnsL || 2) + '"');
        lines.push(indent + '    columnsM="' + (d.columnsM || 1) + '"');
        lines.push(indent + '    labelSpanL="4" labelSpanM="4" labelSpanS="12">');
        lines.push(indent + '    <f:content>');

        // Keep field order by row
        var rows = this._groupRows(fields);
        rows.forEach(function (row) {
            // SimpleForm handles the layout, so keeping the order is enough
            row.forEach(function (field) {
                this._formField(lines, field, indent + "        ");
            }, this);
        }, this);

        (buttons || []).forEach(function (btn) {
            this._ctrl(lines, btn, indent + "        ");
        }, this);

        lines.push(indent + '    </f:content>');
        lines.push(indent + '</f:SimpleForm>');
    };
    // Render a form field

    WireframeXmlGenerator.prototype._formField = function (lines, item, indent) {
        var d = this._data(item);
        var labelText = d._resolvedLabel || d.label || d.text || item.type;

        // Label
        var lAttrs = ['text="' + this._esc(labelText) + '"'];
        if (d.required)     lAttrs.push('required="true"');
        if (d.displayOnly)  lAttrs.push('displayOnly="true"');
        lines.push(indent + '<Label ' + lAttrs.join(" ") + ' />');

        // Control
        if (item.type === "input") {
            var a = ['value="' + this._esc(d.value || "") + '"'];
            if (d.placeholder) a.push('placeholder="' + this._esc(d.placeholder) + '"');
            if (d.type && d.type !== "Text") a.push('type="' + this._esc(d.type) + '"');
            if (d.maxLength)   a.push('maxLength="' + d.maxLength + '"');
            if (d.editable === false) a.push('editable="false"');
            if (d.enabled  === false) a.push('enabled="false"');
            if (d.required)    a.push('required="true"');
            if (d.valueState && d.valueState !== "None") a.push('valueState="' + this._esc(d.valueState) + '"');
            if (d.width && this._safeWidth(d.width)) a.push('width="' + this._esc(d.width) + '"');
            lines.push(indent + '<Input ' + a.join(" ") + ' />');

        } else if (item.type === "select") {
            var sa = [];
            if (d.selectedKey) sa.push('selectedKey="' + this._esc(d.selectedKey) + '"');
            if (d.enabled  === false) sa.push('enabled="false"');
            if (d.required)    sa.push('required="true"');
            if (d.valueState && d.valueState !== "None") sa.push('valueState="' + this._esc(d.valueState) + '"');
            if (d.width && this._safeWidth(d.width)) sa.push('width="' + this._esc(d.width) + '"');
            lines.push(indent + '<Select' + (sa.length ? ' ' + sa.join(" ") : "") + ' />');

        } else if (item.type === "date") {
            var da = ['value="' + this._esc(d.value || "") + '"'];
            da.push('displayFormat="' + (d.displayFormat || "dd/MM/yyyy") + '"');
            if (d.placeholder)  da.push('placeholder="' + this._esc(d.placeholder) + '"');
            if (d.enabled  === false) da.push('enabled="false"');
            if (d.required)     da.push('required="true"');
            if (d.valueState && d.valueState !== "None") da.push('valueState="' + this._esc(d.valueState) + '"');
            if (d.width && this._safeWidth(d.width)) da.push('width="' + this._esc(d.width) + '"');
            lines.push(indent + '<DatePicker ' + da.join(" ") + ' />');
        }
    };
    // Render a table

    WireframeXmlGenerator.prototype._table = function (lines, item, indent) {
        var d    = this._data(item);
        var cols = d.cols || d.columns || ["Coluna 1", "Coluna 2", "Coluna 3"];
        var mode = d.mode || "None";

        lines.push(indent + '<Table');
        lines.push(indent + '    id="table"');
        lines.push(indent + '    items="{/items}"');
        if (mode !== "None") lines.push(indent + '    mode="' + mode + '"');
        if (d.growing)       lines.push(indent + '    growing="true"');
        if (d.growingThreshold) lines.push(indent + '    growingThreshold="' + d.growingThreshold + '"');
        if (d.alternateRowColors) lines.push(indent + '    alternateRowColors="true"');
        if (d.sticky)        lines.push(indent + '    sticky="' + this._esc(d.sticky) + '"');
        lines.push(indent + '    noDataText="' + this._esc(d.noDataText || "Nenhum dado encontrado") + '">');

        lines.push(indent + '    <headerToolbar>');
        lines.push(indent + '        <OverflowToolbar>');
        lines.push(indent + '            <Title text="' + this._esc(d.headerTitle || d.title || "Itens") + '" level="H3" />');
        lines.push(indent + '            <ToolbarSpacer />');
        lines.push(indent + '        </OverflowToolbar>');
        lines.push(indent + '    </headerToolbar>');

        lines.push(indent + '    <columns>');
        cols.forEach(function (col) {
            lines.push(indent + '        <Column>');
            lines.push(indent + '            <Text text="' + this._esc(col) + '" />');
            lines.push(indent + '        </Column>');
        }, this);
        lines.push(indent + '    </columns>');

        lines.push(indent + '    <items>');
        lines.push(indent + '        <ColumnListItem type="Navigation" press=".onItemPress">');
        lines.push(indent + '            <cells>');
        cols.forEach(function (col) {
            lines.push(indent + '                <Text text="{' + this._camel(col) + '}" />');
        }, this);
        lines.push(indent + '            </cells>');
        lines.push(indent + '        </ColumnListItem>');
        lines.push(indent + '    </items>');
        lines.push(indent + '</Table>');
    };
    // Render a control

    WireframeXmlGenerator.prototype._ctrl = function (lines, item, indent) {
        var d = this._data(item);
        switch (item.type) {

            case "title":
                lines.push(indent + '<Title');
                lines.push(indent + '    text="' + this._esc(d.text || "") + '"');
                if (d.level) lines.push(indent + '    level="' + d.level + '"');
                if (d.wrapping) lines.push(indent + '    wrapping="true"');
                if (d.textAlign && d.textAlign !== "Initial") lines.push(indent + '    textAlign="' + this._esc(d.textAlign) + '"');
                if (d.width) lines.push(indent + '    width="' + this._esc(d.width) + '"');
                lines.push(indent + '/>');
                break;

            case "text":
                lines.push(indent + '<Text');
                lines.push(indent + '    text="' + this._esc(d.text || "") + '"');
                if (d.wrapping === false) lines.push(indent + '    wrapping="false"');
                if (d.maxLines) lines.push(indent + '    maxLines="' + d.maxLines + '"');
                if (d.width) lines.push(indent + '    width="' + this._esc(d.width) + '"');
                lines.push(indent + '/>');
                break;

            case "label":
                lines.push(indent + '<Label');
                lines.push(indent + '    text="' + this._esc(d.text || d.label || "") + '"');
                if (d.required) lines.push(indent + '    required="true"');
                if (d.width) lines.push(indent + '    width="' + this._esc(d.width) + '"');
                lines.push(indent + '/>');
                break;

            case "button":
                var type    = d.emph ? "Emphasized" : (d.type || "Default");
                var handler = d.press || (".on" + this._handler(d.text || "Action"));
                lines.push(indent + '<Button');
                lines.push(indent + '    text="' + this._esc(d.text || "Action") + '"');
                lines.push(indent + '    type="' + type + '"');
                if (d.icon)           lines.push(indent + '    icon="' + this._esc(d.icon) + '"');
                if (d.enabled === false) lines.push(indent + '    enabled="false"');
                if (d.width)          lines.push(indent + '    width="' + this._esc(d.width) + '"');
                lines.push(indent + '    press="' + handler + '"');
                lines.push(indent + '/>');
                break;

            case "status":
                lines.push(indent + '<ObjectStatus');
                if (d.title) lines.push(indent + '    title="' + this._esc(d.title) + '"');
                lines.push(indent + '    text="' + this._esc(d.text || "") + '"');
                if (d.state)    lines.push(indent + '    state="' + d.state + '"');
                if (d.icon)     lines.push(indent + '    icon="' + this._esc(d.icon) + '"');
                if (d.active)   lines.push(indent + '    active="true"');
                if (d.inverted) lines.push(indent + '    inverted="true"');
                lines.push(indent + '/>');
                break;

            case "toolbar":
                lines.push(indent + '<Toolbar>');
                if (d.title) lines.push(indent + '    <Title text="' + this._esc(d.title) + '" />');
                lines.push(indent + '    <ToolbarSpacer />');
                this._toolbarBtns(lines, item, indent + "    ");
                lines.push(indent + '</Toolbar>');
                break;

            case "table":
                this._table(lines, item, indent);
                break;

            case "form":
                this._formItem(lines, item, indent);
                break;

            // Wrap standalone form fields in a minimal SimpleForm
            case "input":
            case "select":
            case "date":
                this._simpleForm(lines, [item], [], indent);
                break;

            default:
                lines.push(indent + '<!-- ' + item.type + ' -->');
        }
    };
    // Helper methods

    /** Matches nearby labels to form fields. */
    WireframeXmlGenerator.prototype._attachLabels = function (fields, labels) {
        var used = new Set();
        return fields.map(function (field) {
            var best = null, bestDist = Infinity;
            labels.forEach(function (lbl) {
                if (used.has(lbl.id)) return;
                var dy = Math.abs((lbl.y || 0) - (field.y || 0));
                var dx = (field.x || 0) - (lbl.x || 0); // The label is expected on the left
                if (dy > ROW_THRESHOLD || dx < -20 || dx > LABEL_MAX_DX) return;
                var dist = dy + Math.abs(dx);
                if (dist < bestDist) { bestDist = dist; best = lbl; }
            });

            var clone = Object.assign({}, field);
            clone.data = Object.assign({}, field.data || {});
            if (best) {
                var ld = this._data(best);
                clone.data._resolvedLabel = ld.text || ld.label || clone.data.label;
                clone.data._labelId       = best.id;
                clone._labelId            = best.id;
                used.add(best.id);
            }
            return clone;
        }, this);
    };

    /** Groups fields into rows. */
    WireframeXmlGenerator.prototype._groupRows = function (items) {
        if (!items.length) return [];
        var sorted = this._sort(items);
        var rows = [[sorted[0]]];
        for (var i = 1; i < sorted.length; i++) {
            var prev = sorted[i - 1], curr = sorted[i];
            if (Math.abs(curr.y - prev.y) <= ROW_THRESHOLD) {
                rows[rows.length - 1].push(curr);
            } else {
                rows.push([curr]);
            }
        }
        return rows;
    };

    WireframeXmlGenerator.prototype._toolbarBtns = function (lines, item, indent) {
        var d = this._data(item);
        var btns = d.btns || d.buttons || d.actions || [];
        btns.forEach(function (t) {
            if (t === "..." || t === "\u22EF") {
                lines.push(indent + '<OverflowToolbarButton icon="sap-icon://overflow" />');
            } else {
                lines.push(indent + '<Button text="' + this._esc(t) + '" press=".on' + this._handler(t) + '" />');
            }
        }, this);
    };

    WireframeXmlGenerator.prototype._objHeaderActions = function (lines, item, indent) {
        var d = this._data(item);
        var btns = d.btns || d.buttons || d.actions || [];
        btns.forEach(function (t) {
            if (t === "..." || t === "\u22EF") {
                lines.push(indent + '<uxap:ObjectPageHeaderActionButton icon="sap-icon://overflow" />');
            } else {
                lines.push(indent + '<uxap:ObjectPageHeaderActionButton text="' + this._esc(t) + '" press=".on' + this._handler(t) + '" />');
            }
        }, this);
    };

    WireframeXmlGenerator.prototype._formItem = function (lines, item, indent) {
        var d      = this._data(item);
        var fields = (d.fields || d.formFields || []).map(function (f, idx) {
            var obj = typeof f === "object" ? f : { label: String(f) };
            return { type: obj.type || "input", data: obj, x: item.x || 0, y: (item.y || 0) + idx * ROW_THRESHOLD, id: (item.id || 0) + "_" + idx };
        });
        if (d.title) lines.push(indent + '<Title text="' + this._esc(d.title) + '" level="H4" />');
        if (fields.length) this._simpleForm(lines, fields, [], indent, d);
        else { lines.push(indent + '<f:SimpleForm editable="true" layout="ColumnLayout">'); lines.push(indent + '</f:SimpleForm>'); }
    };

    // XML helpers
    WireframeXmlGenerator.prototype._header = function (lines, ns, ctrl) {
        lines.push('<mvc:View');
        lines.push('    controllerName="' + ctrl + '"');
        ns.forEach(function (n) { if (XMLNS[n]) lines.push('    ' + XMLNS[n]); });
        lines.push('>');
    };

    WireframeXmlGenerator.prototype._collectNs = function (items) {
        var ns = new Set(["mvc", "m"]);
        items.forEach(function (i) {
            (NS_MAP[i.type] || []).forEach(function (n) { ns.add(n); });
        });
        return ns;
    };

    WireframeXmlGenerator.prototype._detectPattern = function (items) {
        var types = items.map(function (i) { return i.type; });
        var hasOH     = types.includes("objectHeader");
        var hasSec    = types.includes("section");
        var hasTable  = types.includes("table");
        var hasForm   = types.includes("form");
        var nFields   = items.filter(function (i) { return FORM_FIELD_TYPES.has(i.type); }).length;
        if (hasOH || (hasSec && hasTable))  return "objectPage";
        if (nFields >= 2 && hasTable)        return "listReport";
        if (hasForm || nFields >= 3)         return "form";
        return "freestyle";
    };

    WireframeXmlGenerator.prototype._meta = function (items, pattern, ns) {
        var types = {};
        items.forEach(function (i) { types[i.type] = (types[i.type] || 0) + 1; });
        return { pattern: pattern, componentCount: items.length, componentTypes: types, namespaces: Array.from(ns) };
    };

    WireframeXmlGenerator.prototype._sort = function (items) {
        return items.slice().sort(function (a, b) { return a.y !== b.y ? a.y - b.y : a.x - b.x; });
    };

    WireframeXmlGenerator.prototype._data = function (item) {
        if (!item) return {};
        var d = Object.assign({}, item.data || {});
        // Normalize fields that sometimes stay at the item root
        ["text","title","label","actions","fields","columns","attributes"].forEach(function (k) {
            if (d[k] === undefined && item[k] != null) d[k] = item[k];
        });
        if (item.ui5Properties) Object.assign(d, item.ui5Properties);
        return d;
    };

    WireframeXmlGenerator.prototype._esc = function (v) {
        return String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    };

    WireframeXmlGenerator.prototype._handler = function (t) {
        if (!t) return "Action";
        return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9 ]/g,"").trim()
            .split(/\s+/).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join("") || "Action";
    };

    WireframeXmlGenerator.prototype._camel = function (t) {
        if (!t) return "value";
        var parts = t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9 ]/g,"").trim().split(/\s+/);
        return parts.map(function (w, i) { return i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1); }).join("") || "value";
    };

    WireframeXmlGenerator.prototype._safeWidth = function (w) {
        if (!w) return false;
        var t = String(w).trim();
        if (t.includes("%") || t === "auto") return true;
        var m = t.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/i);
        if (!m) return false;
        var v = parseFloat(m[1]), u = m[2].toLowerCase();
        return (u === "px" && v <= 420) || ((u === "rem" || u === "em") && v <= 24);
    };

    return WireframeXmlGenerator;
});

