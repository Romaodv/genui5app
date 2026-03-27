sap.ui.define([
    "ui5generator/utils/WireframeXmlGenerator",
    "sap/ui/core/mvc/XMLView"
], function (WireframeXmlGenerator, XMLView) {
    "use strict";

    function item(overrides) {
        return Object.assign({
            id: 1,
            x: 40,
            y: 40,
            type: "text",
            ui5Properties: {}
        }, overrides);
    }

    function createRichComponentCases() {
        return [
            { name: "title_full", items: [item({ type: "title", text: "Heading", ui5Properties: { width: "20rem", level: "H2", titleStyle: "H2", wrapping: true, textAlign: "Center" } })] },
            { name: "text_full", items: [item({ type: "text", text: "Long body copy", ui5Properties: { width: "24rem", maxLines: 3, wrapping: false, textAlign: "Center" } })] },
            { name: "label_full", items: [item({ type: "label", text: "Customer", ui5Properties: { width: "12rem", required: true, displayOnly: true, textAlign: "End" } })] },
            { name: "input_full", items: [item({ type: "input", label: "Customer", ui5Properties: { width: "20rem", value: "ACME", placeholder: "Enter customer", type: "Email", maxLength: 50, editable: false, enabled: false, required: true, valueState: "Error", valueStateText: "Invalid", showSuggestion: true } })] },
            { name: "select_full", items: [item({ type: "select", label: "Status", ui5Properties: { width: "16rem", selectedKey: "OPEN", forceSelection: false, enabled: false, editable: false, required: true, valueState: "Warning", autoAdjustWidth: true } })] },
            { name: "date_full", items: [item({ type: "date", label: "Created On", ui5Properties: { width: "18rem", value: "2026-03-25", dateValue: "2026-03-25", displayFormat: "dd/MM/yyyy", valueFormat: "yyyy-MM-dd", placeholder: "Select date", enabled: false, editable: false, required: true, valueState: "Success", minDate: "2026-01-01", maxDate: "2026-12-31" } })] },
            { name: "button_full", items: [item({ type: "button", text: "Save", ui5Properties: { width: "12rem", type: "Emphasized", icon: "sap-icon://save", iconFirst: false, enabled: false, press: ".onSave" } })] },
            { name: "table_full", items: [item({ type: "table", columns: ["Id", "Name", "Status"], ui5Properties: { width: "100%", noDataText: "No entries", mode: "MultiSelect", inset: true, alternateRowColors: true, sticky: "ColumnHeaders", growing: true, growingThreshold: 10, showSeparators: "Inner" } })] },
            { name: "status_full", items: [item({ type: "status", text: "Open", ui5Properties: { width: "10rem", title: "State", state: "Success", icon: "sap-icon://message-success", active: true, inverted: true } })] },
            { name: "toolbar_full", items: [item({ type: "toolbar", actions: ["Edit", "Delete", "..."], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } })] },
            { name: "form_full", items: [item({ type: "form", title: "Customer Data", fields: ["Name", "Email", "Created On"], ui5Properties: { width: "100%", title: "Customer Data", editable: true, layout: "ResponsiveGridLayout", labelSpanL: 4, labelSpanM: 4, labelSpanS: 12, columnsL: 2, columnsM: 1, maxContainerCols: 2 } })] },
            { name: "objectheader_full", items: [item({ type: "objectHeader", title: "Fallback Title", attributes: ["Customer ACME", "Open"], ui5Properties: { objectTitle: "Semantic Title", objectSubtitle: "Detailed subtitle", showTitleSelector: true, showMarkers: true, markFavorite: true, markLocked: true, objectImageURI: "https://example.com/object.png", objectImageShape: "Circle" } })] }
        ];
    }

    function createPresetCases() {
        return [
            {
                name: "preset_object_page_full",
                items: [
                    item({ id: 1, type: "objectHeader", x: 40, y: 30, title: "Sales Order 4711", attributes: ["Customer ACME", "Open", "Updated today"], ui5Properties: { objectTitle: "Sales Order 4711", objectSubtitle: "Created by John", showMarkers: true, markFavorite: true, objectImageURI: "https://example.com/object.png", objectImageShape: "Circle" } }),
                    item({ id: 2, type: "toolbar", x: 40, y: 130, actions: ["Edit", "Delete", "Share"], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } }),
                    item({ id: 3, type: "section", x: 40, y: 210, text: "General Information", ui5Properties: { titleUppercase: false } }),
                    item({ id: 4, type: "form", x: 40, y: 260, title: "Main Data", fields: ["Customer", "Sales Org", "Requested Date", "Status"], ui5Properties: { width: "100%", editable: true, layout: "ResponsiveGridLayout", columnsL: 2, columnsM: 1, maxContainerCols: 2 } }),
                    item({ id: 5, type: "button", x: 40, y: 500, text: "Approve", ui5Properties: { width: "12rem", type: "Emphasized", icon: "sap-icon://accept", press: ".onApprove" } }),
                    item({ id: 6, type: "section", x: 40, y: 560, text: "Items" }),
                    item({ id: 7, type: "table", x: 40, y: 620, columns: ["Item", "Material", "Quantity"], ui5Properties: { width: "100%", mode: "MultiSelect", growing: true, sticky: "ColumnHeaders" } }),
                    item({ id: 8, type: "status", x: 600, y: 35, text: "Released", ui5Properties: { width: "10rem", title: "Lifecycle", state: "Success", active: true } })
                ]
            },
            {
                name: "preset_worklist_full",
                items: [
                    item({ id: 1, type: "title", x: 40, y: 30, text: "Customer Worklist", ui5Properties: { width: "20rem", level: "H1", titleStyle: "H1", wrapping: true } }),
                    item({ id: 2, type: "toolbar", x: 40, y: 90, actions: ["New", "Export", "..."], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } }),
                    item({ id: 3, type: "form", x: 40, y: 160, title: "Filters", fields: ["Customer", "Status", "Created On", "Sales Org"], ui5Properties: { width: "100%", editable: true, layout: "ResponsiveGridLayout", columnsL: 2, columnsM: 1 } }),
                    item({ id: 4, type: "button", x: 40, y: 390, text: "Search", ui5Properties: { width: "10rem", type: "Emphasized", press: ".onSearch" } }),
                    item({ id: 5, type: "table", x: 40, y: 460, columns: ["Customer", "City", "Status"], ui5Properties: { width: "100%", noDataText: "No customers found", mode: "SingleSelectMaster", growing: true, growingThreshold: 15 } }),
                    item({ id: 6, type: "status", x: 560, y: 32, text: "Draft", ui5Properties: { width: "10rem", state: "Information", title: "State" } })
                ],
                opts: { patternHint: "listReport" }
            }
        ];
    }

    async function validatePreview(assert, name, items, opts) {
        var generator = new WireframeXmlGenerator();
        var result = generator.generate(items, opts);
        return validateXmlDefinition(assert, name, result.xml, result);
    }

    async function validateXmlDefinition(assert, name, xml, result) {
        var view;

        try {
            view = await XMLView.create({
                id: "qunit_" + name.replace(/[^a-z0-9_]/gi, "_"),
                definition: xml
            });
            assert.ok(view, name + ": XMLView created");
            return {
                view: view,
                result: result || { xml: xml }
            };
        } catch (error) {
            assert.ok(false, name + ": XMLView.create failed - " + (error && error.message ? error.message : error) + "\n" + xml);
        } finally {
            if (view) {
                view.destroy();
            }
        }
    }

    QUnit.module("WireframeXmlGenerator Preview");

    QUnit.test("valida preview dos componentes básicos", async function (assert) {
        var cases = [
            { name: "title", items: [item({ type: "title", text: "Heading" })] },
            { name: "text", items: [item({ type: "text", text: "Body copy" })] },
            { name: "label", items: [item({ type: "label", text: "Name" })] },
            { name: "input", items: [item({ type: "input", label: "Name" })] },
            { name: "select", items: [item({ type: "select", label: "Country" })] },
            { name: "date", items: [item({ type: "date", label: "Created On" })] },
            { name: "button", items: [item({ type: "button", text: "Save" })] },
            { name: "table", items: [item({ type: "table", columns: ["Id", "Name", "Status"] })] },
            { name: "status", items: [item({ type: "status", text: "Open", state: "Information" })] },
            { name: "toolbar", items: [item({ type: "toolbar", actions: ["Edit", "Delete"] })] },
            { name: "form", items: [item({ type: "form", title: "Customer", fields: ["Name", "Email"] })] }
        ];

        for (var i = 0; i < cases.length; i++) {
            await validatePreview(assert, cases[i].name, cases[i].items);
        }
    });

    QUnit.test("valida preview do object header", async function (assert) {
        await validatePreview(assert, "objectheader_basic", [
            item({
                type: "objectHeader",
                title: "Order 4711",
                attributes: ["Customer ACME", "Open", "Updated today"],
                ui5Properties: {
                    objectTitle: "Order 4711",
                    objectSubtitle: "Sales order"
                }
            })
        ]);
    });

    QUnit.test("valida preview do object header com imagem", async function (assert) {
        await validatePreview(assert, "objectheader_image", [
            item({
                type: "objectHeader",
                title: "Order 4711",
                attributes: ["Customer ACME"],
                ui5Properties: {
                    objectTitle: "Order 4711",
                    objectSubtitle: "Updated today",
                    objectImageURI: "https://example.com/avatar.png"
                }
            })
        ]);
    });

    QUnit.test("valida preview do object header com title separado", async function (assert) {
        await validatePreview(assert, "objectheader_with_page_title", [
            item({
                id: 1,
                type: "title",
                text: "Customer Registration"
            }),
            item({
                id: 2,
                y: 120,
                type: "objectHeader",
                title: "Order 4711",
                attributes: ["Customer ACME", "Open"],
                ui5Properties: {
                    objectTitle: "teste"
                }
            })
        ]);
    });

    QUnit.test("valida object page composto com section, form, toolbar e table", async function (assert) {
        await validatePreview(assert, "objectpage_composite", [
            item({
                id: 1,
                type: "title",
                text: "Customer Registration"
            }),
            item({
                id: 2,
                y: 100,
                type: "objectHeader",
                title: "Order 4711",
                attributes: ["Customer ACME", "Open", "Updated today"],
                ui5Properties: {
                    objectTitle: "Order 4711",
                    objectSubtitle: "Sales order",
                    showMarkers: true
                }
            }),
            item({
                id: 3,
                y: 180,
                type: "toolbar",
                actions: ["Edit", "Delete", "Share"]
            }),
            item({
                id: 4,
                y: 260,
                type: "section",
                text: "General Information",
                ui5Properties: {
                    titleUppercase: false
                }
            }),
            item({
                id: 5,
                y: 320,
                type: "form",
                title: "Customer Data",
                fields: ["Name", "Email", "Created On"],
                ui5Properties: {
                    width: "100%",
                    columnsL: 2
                }
            }),
            item({
                id: 6,
                y: 620,
                type: "section",
                text: "Items"
            }),
            item({
                id: 7,
                y: 680,
                type: "table",
                columns: ["Item", "Quantity", "Status"],
                ui5Properties: {
                    width: "100%",
                    growing: true
                }
            })
        ]);
    });

    QUnit.test("valida list report com filtros, botões e tabela", async function (assert) {
        await validatePreview(assert, "listreport_composite", [
            item({
                id: 1,
                type: "title",
                text: "Customers"
            }),
            item({
                id: 2,
                y: 80,
                type: "toolbar",
                actions: ["New", "Export"]
            }),
            item({
                id: 3,
                y: 160,
                x: 40,
                type: "input",
                label: "Customer",
                ui5Properties: {
                    width: "18rem"
                }
            }),
            item({
                id: 4,
                y: 160,
                x: 320,
                type: "select",
                label: "Status",
                ui5Properties: {
                    width: "14rem"
                }
            }),
            item({
                id: 5,
                y: 240,
                type: "button",
                text: "Search",
                ui5Properties: {
                    width: "10rem"
                }
            }),
            item({
                id: 6,
                y: 320,
                type: "table",
                columns: ["Customer", "City", "Status"],
                ui5Properties: {
                    width: "100%"
                }
            })
        ], { patternHint: "listReport" });
    });

    QUnit.test("valida simple page com mistura de componentes e widths", async function (assert) {
        await validatePreview(assert, "freestyle_mixed", [
            item({
                id: 1,
                type: "title",
                text: "Account Settings"
            }),
            item({
                id: 2,
                y: 80,
                type: "text",
                text: "Maintain your account preferences.",
                ui5Properties: {
                    width: "24rem"
                }
            }),
            item({
                id: 3,
                y: 160,
                type: "label",
                text: "Email",
                ui5Properties: {
                    width: "8rem"
                }
            }),
            item({
                id: 4,
                y: 200,
                type: "input",
                label: "Email",
                ui5Properties: {
                    width: "20rem",
                    valueState: "None"
                }
            }),
            item({
                id: 5,
                y: 280,
                type: "status",
                text: "Active",
                state: "Success",
                ui5Properties: {
                    width: "10rem"
                }
            }),
            item({
                id: 6,
                y: 360,
                type: "button",
                text: "Save",
                ui5Properties: {
                    width: "12rem"
                }
            })
        ], { patternHint: "freestyle" });
    });

    QUnit.test("valida object header respeitando propriedades UI5 críticas", async function (assert) {
        var preview = await validatePreview(assert, "objectheader_ui5_properties", [
            item({
                type: "objectHeader",
                title: "Fallback Title",
                attributes: ["Customer ACME", "Open"],
                ui5Properties: {
                    objectTitle: "Semantic Title",
                    objectSubtitle: "Detailed subtitle",
                    showTitleSelector: true,
                    showMarkers: true,
                    markFavorite: true,
                    markLocked: true,
                    objectImageURI: "https://example.com/object.png",
                    objectImageShape: "Circle"
                }
            })
        ]);

        assert.ok(preview.result.xml.indexOf('objectTitle="Semantic Title"') > -1, "objectTitle applied");
        assert.ok(preview.result.xml.indexOf('objectSubtitle="Detailed subtitle"') > -1, "objectSubtitle applied");
        assert.ok(preview.result.xml.indexOf('showTitleSelector="true"') > -1, "showTitleSelector applied");
        assert.ok(preview.result.xml.indexOf('markFavorite="true"') > -1, "markFavorite applied");
    });
    QUnit.test("valida preview dos componentes com todas as propriedades populadas", async function (assert) {
        var cases = createRichComponentCases();

        for (var i = 0; i < cases.length; i++) {
            await validatePreview(assert, cases[i].name, cases[i].items, cases[i].opts);
        }
    });

    QUnit.test("valida preview da combinação objectHeader form button title", async function (assert) {
        var preview = await validatePreview(assert, "objectheader_form_button_title", [
            item({ id: 1, type: "title", text: "Customer Registration", ui5Properties: { width: "20rem", level: "H1" } }),
            item({ id: 2, y: 100, type: "objectHeader", title: "Fallback Object", attributes: ["Customer ACME", "Open"], ui5Properties: { objectTitle: "Customer 1000", objectSubtitle: "Detailed subtitle", showMarkers: true } }),
            item({ id: 3, y: 260, type: "form", title: "Main Data", fields: ["Name", "Email", "Created On"], ui5Properties: { width: "100%", editable: true, columnsL: 2 } }),
            item({ id: 4, y: 500, type: "button", text: "Save", ui5Properties: { width: "12rem", type: "Emphasized", press: ".onSave" } })
        ]);

        assert.ok(preview.result.xml.indexOf('title="Customer Registration"') === -1, "page title not duplicated on ObjectPage");
        assert.ok(preview.result.xml.indexOf('objectTitle="Customer 1000"') > -1, "object header title applied");
    });

    QUnit.test("valida preview de todos os presets com propriedades populadas", async function (assert) {
        var presets = createPresetCases();

        for (var i = 0; i < presets.length; i++) {
            await validatePreview(assert, presets[i].name, presets[i].items, presets[i].opts);
        }
    });

    QUnit.test("valida preview de XML bruto object page com form", async function (assert) {
        var xml = [
            '<mvc:View',
            '    controllerName="ui5generator.controller.XmlPreview"',
            '    xmlns:mvc="sap.ui.core.mvc"',
            '    xmlns="sap.m"',
            '    xmlns:uxap="sap.uxap"',
            '    xmlns:f="sap.ui.layout.form"',
            '>',
            '    <Page',
            '        showNavButton="true"',
            '        navButtonPress=".onNavButtonPress"',
            '        enableScrolling="false">',
            '        <content>',
            '            <uxap:ObjectPageLayout',
            '                id="objectPageLayout"',
            '                showTitleInHeaderContent="true"',
            '                alwaysShowContentHeader="false">',
            '                <uxap:headerTitle>',
            '                    <uxap:ObjectPageHeader',
            '                        objectTitle="Customer Registration"',
            '                    >',
            '                        <uxap:actions>',
            '                            <uxap:ObjectPageHeaderActionButton text="Edit" press=".onEdit" />',
            '                            <uxap:ObjectPageHeaderActionButton text="Approve" press=".onApprove" />',
            '                            <uxap:ObjectPageHeaderActionButton text="Cancel" press=".onCancel" />',
            '                        </uxap:actions>',
            '                    </uxap:ObjectPageHeader>',
            '                </uxap:headerTitle>',
            '                <uxap:headerContent>',
            '                    <VBox>',
            '                        <ObjectAttribute title="Customer ACME" text="" />',
            '                        <ObjectAttribute title="Open" text="" />',
            '                        <ObjectAttribute title="Updated today" text="" />',
            '                    </VBox>',
            '                </uxap:headerContent>',
            '                <uxap:sections>',
            '                    <uxap:ObjectPageSection',
            '                        title="General Information"',
            '                        titleUppercase="true">',
            '                        <uxap:subSections>',
            '                            <uxap:ObjectPageSubSection title="">',
            '                                <uxap:blocks>',
            '                                    <f:SimpleForm',
            '                                        editable="false"',
            '                                        layout="ResponsiveGridLayout"',
            '                                        width="24.6%"',
            '                                        columnsL="2" columnsM="1"',
            '                                        labelSpanL="4" labelSpanM="2" labelSpanS="12"',
            '                                        maxContainerCols="2"',
            '                                    >',
            '                                        <f:content>',
            '                                            <Label text="Name" />',
            '                                            <Input value="" />',
            '                                            <Label text="Type" />',
            '                                            <Input value="" />',
            '                                            <Label text="Date" />',
            '                                            <Input value="" />',
            '                                        </f:content>',
            '                                    </f:SimpleForm>',
            '                                </uxap:blocks>',
            '                            </uxap:ObjectPageSubSection>',
            '                        </uxap:subSections>',
            '                    </uxap:ObjectPageSection>',
            '                </uxap:sections>',
            '            </uxap:ObjectPageLayout>',
            '        </content>',
            '    </Page>',
            '</mvc:View>'
        ].join("\n");

        await validateXmlDefinition(assert, "raw_objectpage_form_xml", xml);
    });

    QUnit.test("valida preview de XML bruto list report complexo", async function (assert) {
        var xml = [
            '<mvc:View',
            '    controllerName="ui5generator.controller.XmlPreview"',
            '    xmlns:mvc="sap.ui.core.mvc"',
            '    xmlns="sap.m"',
            '    xmlns:f="sap.ui.layout.form"',
            '>',
            '    <Page',
            '        title="Customer Worklist"',
            '        showNavButton="false">',
            '        <subHeader>',
            '            <Toolbar>',
            '                <Button text="New" press=".onNew" />',
            '                <Button text="Export" press=".onExport" />',
            '                <ToolbarSpacer />',
            '            </Toolbar>',
            '        </subHeader>',
            '        <content>',
            '            <VBox class="sapUiSmallMargin">',
            '                <f:SimpleForm',
            '                    editable="true"',
            '                    layout="ResponsiveGridLayout"',
            '                    width="100%"',
            '                    columnsL="4" columnsM="2"',
            '                    labelSpanL="12" labelSpanM="12" labelSpanS="12"',
            '                >',
            '                    <f:content>',
            '                        <Label text="Customer" />',
            '                        <Input width="18rem" value="" placeholder="Customer" />',
            '                        <Label text="Status" />',
            '                        <Select width="14rem" selectedKey="OPEN" />',
            '                        <Label text="Created On" />',
            '                        <DatePicker width="14rem" value="" displayFormat="dd/MM/yyyy" valueFormat="yyyy-MM-dd" />',
            '                    </f:content>',
            '                </f:SimpleForm>',
            '                <HBox>',
            '                    <Button text="Search" type="Emphasized" press=".onSearch" />',
            '                    <Button text="Clear" press=".onClear" />',
            '                </HBox>',
            '                <Table',
            '                    id="customerTable"',
            '                    width="100%"',
            '                    items="{/items}"',
            '                    mode="SingleSelectMaster"',
            '                    growing="true"',
            '                    growingThreshold="20"',
            '                    noDataText="No customers found">',
            '                    <headerToolbar>',
            '                        <OverflowToolbar>',
            '                            <Title text="Customers" level="H3" />',
            '                            <ToolbarSpacer />',
            '                        </OverflowToolbar>',
            '                    </headerToolbar>',
            '                    <columns>',
            '                        <Column><Text text="Customer" /></Column>',
            '                        <Column><Text text="City" /></Column>',
            '                        <Column><Text text="Status" /></Column>',
            '                    </columns>',
            '                    <items>',
            '                        <ColumnListItem type="Navigation" press=".onItemPress">',
            '                            <cells>',
            '                                <Text text="{customer}" />',
            '                                <Text text="{city}" />',
            '                                <ObjectStatus text="{status}" state="Success" />',
            '                            </cells>',
            '                        </ColumnListItem>',
            '                    </items>',
            '                </Table>',
            '            </VBox>',
            '        </content>',
            '    </Page>',
            '</mvc:View>'
        ].join("\n");

        await validateXmlDefinition(assert, "raw_listreport_complex_xml", xml);
    });

    QUnit.test("valida preview de XML bruto object page com múltiplas seções", async function (assert) {
        var xml = [
            '<mvc:View',
            '    controllerName="ui5generator.controller.XmlPreview"',
            '    xmlns:mvc="sap.ui.core.mvc"',
            '    xmlns="sap.m"',
            '    xmlns:uxap="sap.uxap"',
            '    xmlns:f="sap.ui.layout.form"',
            '>',
            '    <Page',
            '        showNavButton="true"',
            '        navButtonPress=".onNavButtonPress"',
            '        enableScrolling="false">',
            '        <content>',
            '            <uxap:ObjectPageLayout',
            '                id="objectPageLayoutComplex"',
            '                showTitleInHeaderContent="true"',
            '                alwaysShowContentHeader="false">',
            '                <uxap:headerTitle>',
            '                    <uxap:ObjectPageHeader',
            '                        objectTitle="Sales Order 4711"',
            '                        objectSubtitle="Created by John Doe"',
            '                        showMarkers="true"',
            '                        markFavorite="true"',
            '                    >',
            '                        <uxap:actions>',
            '                            <uxap:ObjectPageHeaderActionButton text="Edit" press=".onEdit" />',
            '                            <uxap:ObjectPageHeaderActionButton text="Approve" press=".onApprove" />',
            '                        </uxap:actions>',
            '                    </uxap:ObjectPageHeader>',
            '                </uxap:headerTitle>',
            '                <uxap:headerContent>',
            '                    <VBox>',
            '                        <ObjectAttribute title="Customer" text="ACME" />',
            '                        <ObjectAttribute title="Lifecycle" text="Released" />',
            '                    </VBox>',
            '                </uxap:headerContent>',
            '                <uxap:sections>',
            '                    <uxap:ObjectPageSection title="General Information" titleUppercase="false">',
            '                        <uxap:subSections>',
            '                            <uxap:ObjectPageSubSection title="">',
            '                                <uxap:blocks>',
            '                                    <f:SimpleForm',
            '                                        editable="true"',
            '                                        layout="ResponsiveGridLayout"',
            '                                        width="100%"',
            '                                        columnsL="2" columnsM="1"',
            '                                        labelSpanL="4" labelSpanM="4" labelSpanS="12"',
            '                                        maxContainerCols="2"',
            '                                    >',
            '                                        <f:content>',
            '                                            <Label text="Customer" />',
            '                                            <Input value="{customer}" />',
            '                                            <Label text="Sales Org" />',
            '                                            <Input value="{salesOrg}" />',
            '                                            <Label text="Requested Date" />',
            '                                            <DatePicker value="{requestedDate}" displayFormat="dd/MM/yyyy" valueFormat="yyyy-MM-dd" />',
            '                                        </f:content>',
            '                                    </f:SimpleForm>',
            '                                </uxap:blocks>',
            '                            </uxap:ObjectPageSubSection>',
            '                        </uxap:subSections>',
            '                    </uxap:ObjectPageSection>',
            '                    <uxap:ObjectPageSection title="Items" titleUppercase="false">',
            '                        <uxap:subSections>',
            '                            <uxap:ObjectPageSubSection title="">',
            '                                <uxap:blocks>',
            '                                    <Table',
            '                                        width="100%"',
            '                                        items="{/items}"',
            '                                        mode="MultiSelect"',
            '                                        growing="true"',
            '                                        growingThreshold="10">',
            '                                        <columns>',
            '                                            <Column><Text text="Item" /></Column>',
            '                                            <Column><Text text="Material" /></Column>',
            '                                            <Column><Text text="Quantity" /></Column>',
            '                                            <Column><Text text="Status" /></Column>',
            '                                        </columns>',
            '                                        <items>',
            '                                            <ColumnListItem type="Inactive">',
            '                                                <cells>',
            '                                                    <Text text="{item}" />',
            '                                                    <Text text="{material}" />',
            '                                                    <Text text="{quantity}" />',
            '                                                    <ObjectStatus text="{status}" state="Information" />',
            '                                                </cells>',
            '                                            </ColumnListItem>',
            '                                        </items>',
            '                                    </Table>',
            '                                </uxap:blocks>',
            '                            </uxap:ObjectPageSubSection>',
            '                        </uxap:subSections>',
            '                    </uxap:ObjectPageSection>',
            '                </uxap:sections>',
            '            </uxap:ObjectPageLayout>',
            '        </content>',
            '    </Page>',
            '</mvc:View>'
        ].join("\n");

        await validateXmlDefinition(assert, "raw_objectpage_multi_section_xml", xml);
    });
});
