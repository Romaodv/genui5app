const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { DOMParser } = require("@xmldom/xmldom");

function loadWireframeXmlGenerator() {
    const filePath = path.join(
        __dirname,
        "..",
        "ui5generator",
        "webapp",
        "utils",
        "WireframeXmlGenerator.js"
    );
    const source = fs.readFileSync(filePath, "utf8");
    let exportedModule = null;

    global.sap = {
        ui: {
            define: function (_deps, factory) {
                exportedModule = factory();
            }
        }
    };

    try {
        new Function(source)();
    } finally {
        delete global.sap;
    }

    return exportedModule;
}

function parseXml(xml) {
    const errors = [];
    const parser = new DOMParser({
        errorHandler: {
            warning: function (msg) {
                errors.push("warning: " + msg);
            },
            error: function (msg) {
                errors.push("error: " + msg);
            },
            fatalError: function (msg) {
                errors.push("fatal: " + msg);
            }
        }
    });

    const doc = parser.parseFromString(xml, "application/xml");
    return { doc, errors };
}

function countOccurrences(text, token) {
    return (text.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
}

function createGenerator() {
    const WireframeXmlGenerator = loadWireframeXmlGenerator();
    return new WireframeXmlGenerator();
}

function baseItem(overrides) {
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
        {
            name: "title_full",
            items: [baseItem({ type: "title", text: "Heading", ui5Properties: { width: "20rem", level: "H2", titleStyle: "H2", wrapping: true, textAlign: "Center" } })]
        },
        {
            name: "text_full",
            items: [baseItem({ type: "text", text: "Long body copy", ui5Properties: { width: "24rem", maxLines: 3, wrapping: false, textAlign: "Center" } })]
        },
        {
            name: "label_full",
            items: [baseItem({ type: "label", text: "Customer", ui5Properties: { width: "12rem", required: true, displayOnly: true, textAlign: "End" } })]
        },
        {
            name: "input_full",
            items: [baseItem({ type: "input", label: "Customer", ui5Properties: { width: "20rem", value: "ACME", placeholder: "Enter customer", type: "Email", maxLength: 50, editable: false, enabled: false, required: true, valueState: "Error", valueStateText: "Invalid", showSuggestion: true } })]
        },
        {
            name: "select_full",
            items: [baseItem({ type: "select", label: "Status", ui5Properties: { width: "16rem", selectedKey: "OPEN", forceSelection: false, enabled: false, editable: false, required: true, valueState: "Warning", autoAdjustWidth: true } })]
        },
        {
            name: "date_full",
            items: [baseItem({ type: "date", label: "Created On", ui5Properties: { width: "18rem", value: "2026-03-25", dateValue: "2026-03-25", displayFormat: "dd/MM/yyyy", valueFormat: "yyyy-MM-dd", placeholder: "Select date", enabled: false, editable: false, required: true, valueState: "Success", minDate: "2026-01-01", maxDate: "2026-12-31" } })]
        },
        {
            name: "button_full",
            items: [baseItem({ type: "button", text: "Save", ui5Properties: { width: "12rem", type: "Emphasized", icon: "sap-icon://save", iconFirst: false, enabled: false, press: ".onSave" } })]
        },
        {
            name: "table_full",
            items: [baseItem({ type: "table", columns: ["Id", "Name", "Status"], ui5Properties: { width: "100%", noDataText: "No entries", mode: "MultiSelect", inset: true, alternateRowColors: true, sticky: "ColumnHeaders", growing: true, growingThreshold: 10, showSeparators: "Inner" } })]
        },
        {
            name: "status_full",
            items: [baseItem({ type: "status", text: "Open", ui5Properties: { width: "10rem", title: "State", state: "Success", icon: "sap-icon://message-success", active: true, inverted: true } })]
        },
        {
            name: "toolbar_full",
            items: [baseItem({ type: "toolbar", actions: ["Edit", "Delete", "..."], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } })]
        },
        {
            name: "form_full",
            items: [baseItem({ type: "form", title: "Customer Data", fields: ["Name", "Email", "Created On"], ui5Properties: { width: "100%", title: "Customer Data", editable: true, layout: "ResponsiveGridLayout", labelSpanL: 4, labelSpanM: 4, labelSpanS: 12, columnsL: 2, columnsM: 1, maxContainerCols: 2 } })]
        },
        {
            name: "section_full",
            items: [baseItem({ type: "section", text: "Details", ui5Properties: { title: "Details", titleUppercase: false, showTitle: true } }), baseItem({ id: 2, y: 120, type: "text", text: "Body" })]
        },
        {
            name: "objectheader_full",
            items: [baseItem({ type: "objectHeader", title: "Fallback Title", attributes: ["Customer ACME", "Open"], ui5Properties: { objectTitle: "Semantic Title", objectSubtitle: "Detailed subtitle", showTitleSelector: true, showMarkers: true, markFavorite: true, markLocked: true, objectImageURI: "https://example.com/object.png", objectImageShape: "Circle" } })]
        }
    ];
}

function createPresetCases() {
    return [
        {
            name: "preset_object_page_full",
            items: [
                baseItem({ id: 1, type: "objectHeader", x: 40, y: 30, title: "Sales Order 4711", attributes: ["Customer ACME", "Open", "Updated today"], ui5Properties: { objectTitle: "Sales Order 4711", objectSubtitle: "Created by John", showMarkers: true, markFavorite: true, objectImageURI: "https://example.com/object.png", objectImageShape: "Circle" } }),
                baseItem({ id: 2, type: "toolbar", x: 40, y: 130, actions: ["Edit", "Delete", "Share"], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } }),
                baseItem({ id: 3, type: "section", x: 40, y: 210, text: "General Information", ui5Properties: { titleUppercase: false } }),
                baseItem({ id: 4, type: "form", x: 40, y: 260, title: "Main Data", fields: ["Customer", "Sales Org", "Requested Date", "Status"], ui5Properties: { width: "100%", editable: true, layout: "ResponsiveGridLayout", columnsL: 2, columnsM: 1, maxContainerCols: 2 } }),
                baseItem({ id: 5, type: "button", x: 40, y: 500, text: "Approve", ui5Properties: { width: "12rem", type: "Emphasized", icon: "sap-icon://accept", press: ".onApprove" } }),
                baseItem({ id: 6, type: "section", x: 40, y: 560, text: "Items" }),
                baseItem({ id: 7, type: "table", x: 40, y: 620, columns: ["Item", "Material", "Quantity"], ui5Properties: { width: "100%", mode: "MultiSelect", growing: true, sticky: "ColumnHeaders" } }),
                baseItem({ id: 8, type: "status", x: 600, y: 35, text: "Released", ui5Properties: { width: "10rem", title: "Lifecycle", state: "Success", active: true } })
            ]
        },
        {
            name: "preset_worklist_full",
            items: [
                baseItem({ id: 1, type: "title", x: 40, y: 30, text: "Customer Worklist", ui5Properties: { width: "20rem", level: "H1", titleStyle: "H1", wrapping: true } }),
                baseItem({ id: 2, type: "toolbar", x: 40, y: 90, actions: ["New", "Export", "..."], ui5Properties: { width: "100%", design: "Solid", height: "3rem", activeDesign: "Active" } }),
                baseItem({ id: 3, type: "form", x: 40, y: 160, title: "Filters", fields: ["Customer", "Status", "Created On", "Sales Org"], ui5Properties: { width: "100%", editable: true, layout: "ResponsiveGridLayout", columnsL: 2, columnsM: 1 } }),
                baseItem({ id: 4, type: "button", x: 40, y: 390, text: "Search", ui5Properties: { width: "10rem", type: "Emphasized", press: ".onSearch" } }),
                baseItem({ id: 5, type: "table", x: 40, y: 460, columns: ["Customer", "City", "Status"], ui5Properties: { width: "100%", noDataText: "No customers found", mode: "SingleSelectMaster", growing: true, growingThreshold: 15 } }),
                baseItem({ id: 6, type: "status", x: 560, y: 32, text: "Draft", ui5Properties: { width: "10rem", state: "Information", title: "State" } })
            ],
            opts: { patternHint: "listReport" }
        }
    ];
}

const tests = [];

function test(name, fn) {
    tests.push({ name, fn });
}

test("gera XML bem-formado para cada componente básico", function () {
    const generator = createGenerator();
    const cases = [
        {
            name: "title",
            items: [baseItem({ type: "title", text: "Heading" })],
            expected: 'title="Heading"'
        },
        {
            name: "text",
            items: [baseItem({ type: "text", text: "Body copy" })],
            expected: "<Text"
        },
        {
            name: "label",
            items: [baseItem({ type: "label", text: "Name" })],
            expected: "<Label"
        },
        {
            name: "input",
            items: [baseItem({ type: "input", label: "Name" })],
            expected: "<Input"
        },
        {
            name: "select",
            items: [baseItem({ type: "select", label: "Country" })],
            expected: "<Select"
        },
        {
            name: "date",
            items: [baseItem({ type: "date", label: "Created On" })],
            expected: "<DatePicker"
        },
        {
            name: "button",
            items: [baseItem({ type: "button", text: "Save" })],
            expected: "<Button"
        },
        {
            name: "table",
            items: [baseItem({ type: "table", columns: ["Id", "Name", "Status"] })],
            expected: "<Table"
        },
        {
            name: "status",
            items: [baseItem({ type: "status", text: "Open", state: "Information" })],
            expected: "<ObjectStatus"
        },
        {
            name: "toolbar",
            items: [baseItem({ type: "toolbar", actions: ["Edit", "Delete"] })],
            expected: "<Toolbar"
        },
        {
            name: "form",
            items: [baseItem({ type: "form", title: "Customer", fields: ["Name", "Email"] })],
            expected: "<f:SimpleForm"
        }
    ];

    cases.forEach(function (entry) {
        const result = generator.generate(entry.items);
        const parsed = parseXml(result.xml);

        assert.equal(parsed.errors.length, 0, entry.name + " should generate well-formed XML");
        assert.match(result.xml, /<mvc:View[\s\S]*<\/mvc:View>/, entry.name + " should have a view root");
        assert.ok(result.xml.includes(entry.expected), entry.name + " should render expected control");
    });
});

test("objectHeader usa ObjectPageHeader sem duplicar title na Page por padrão", function () {
    const generator = createGenerator();
    const result = generator.generate([
        baseItem({
            type: "objectHeader",
            title: "Order 4711",
            attributes: ["Customer ACME", "Open", "Updated today"],
            ui5Properties: {
                objectTitle: "Order 4711",
                objectSubtitle: "Sales order"
            }
        })
    ]);
    const parsed = parseXml(result.xml);

    assert.equal(parsed.errors.length, 0);
    assert.ok(result.xml.includes("<uxap:ObjectPageHeader"));
    assert.ok(result.xml.includes('objectTitle="Order 4711"'));
    assert.ok(!result.xml.includes('title=""'));
    assert.equal(countOccurrences(result.xml, "<VBox>"), 1);
    assert.equal(countOccurrences(result.xml, "</VBox>"), 1);
    assert.equal(countOccurrences(result.xml, 'objectTitle="Order 4711"'), 1);
});

test("objectHeader com title separado não duplica título na Page e mantém objectTitle no header", function () {
    const generator = createGenerator();
    const result = generator.generate([
        baseItem({
            id: 1,
            type: "title",
            text: "Customer Registration"
        }),
        baseItem({
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
    const parsed = parseXml(result.xml);

    assert.equal(parsed.errors.length, 0);
    assert.ok(result.xml.includes('<Page'));
    assert.ok(!result.xml.includes('title="Customer Registration"'));
    assert.ok(result.xml.includes('objectTitle="teste"'));
    assert.ok(!result.xml.includes('<Title text="Customer Registration"'));
});

test("objectHeader com objectImageURI renderiza só no ObjectPageHeader", function () {
    const generator = createGenerator();
    const result = generator.generate([
        baseItem({
            type: "objectHeader",
            title: "Order 4711",
            attributes: ["Customer ACME"],
            ui5Properties: {
                objectTitle: "Order 4711",
                objectImageURI: "https://example.com/avatar.png",
                objectSubtitle: "Updated today"
            }
        })
    ]);
    const parsed = parseXml(result.xml);

    assert.equal(parsed.errors.length, 0);
    assert.ok(result.xml.includes('objectImageURI="https://example.com/avatar.png"'));
    assert.ok(result.xml.includes('objectSubtitle="Updated today"'));
    assert.equal(countOccurrences(result.xml, "objectImageURI="), 1);
    assert.ok(!result.xml.includes("<Avatar"));
    assert.ok(!result.xml.includes("<HBox"));
});

test("ui5Properties.width é aplicada no XML determinístico", function () {
    const generator = createGenerator();
    const result = generator.generate([
        baseItem({
            type: "input",
            label: "Customer",
            ui5Properties: {
                width: "20rem"
            }
        }),
        baseItem({
            id: 2,
            y: 120,
            type: "button",
            text: "Save",
            ui5Properties: {
                width: "12rem"
            }
        })
    ]);
    const parsed = parseXml(result.xml);

    assert.equal(parsed.errors.length, 0);
    assert.match(result.xml, /<Input\b[^>]*width="20rem"/);
    assert.match(result.xml, /<Button\b[^>]*width="12rem"/);
});

test("gera XML bem-formado para componentes com todas as propriedades populadas", function () {
    const generator = createGenerator();

    createRichComponentCases().forEach(function (entry) {
        const result = generator.generate(entry.items);
        const parsed = parseXml(result.xml);

        assert.equal(parsed.errors.length, 0, entry.name + " should generate well-formed XML");
        assert.match(result.xml, /<mvc:View[\s\S]*<\/mvc:View>/, entry.name + " should have a view root");
    });
});

test("gera XML correto para combinação objectHeader form button title", function () {
    const generator = createGenerator();
    const result = generator.generate([
        baseItem({ id: 1, type: "title", text: "Customer Registration", ui5Properties: { width: "20rem", level: "H1" } }),
        baseItem({ id: 2, y: 100, type: "objectHeader", title: "Fallback Object", attributes: ["Customer ACME", "Open"], ui5Properties: { objectTitle: "Customer 1000", objectSubtitle: "Detailed subtitle", showMarkers: true } }),
        baseItem({ id: 3, y: 260, type: "form", title: "Main Data", fields: ["Name", "Email", "Created On"], ui5Properties: { width: "100%", editable: true, columnsL: 2 } }),
        baseItem({ id: 4, y: 500, type: "button", text: "Save", ui5Properties: { width: "12rem", type: "Emphasized", press: ".onSave" } })
    ]);
    const parsed = parseXml(result.xml);

    assert.equal(parsed.errors.length, 0);
    assert.ok(result.xml.includes('objectTitle="Customer 1000"'));
    assert.match(result.xml, /<f:SimpleForm\b[^>]*width="100%"/);
    assert.match(result.xml, /<Button\b[^>]*width="12rem"/);
});

test("gera XML bem-formado para todos os presets com propriedades populadas", function () {
    const generator = createGenerator();

    createPresetCases().forEach(function (entry) {
        const result = generator.generate(entry.items, entry.opts);
        const parsed = parseXml(result.xml);

        assert.equal(parsed.errors.length, 0, entry.name + " should generate well-formed XML");
        assert.match(result.xml, /<mvc:View[\s\S]*<\/mvc:View>/, entry.name + " should have a view root");
    });
});

let failed = false;

tests.forEach(function (entry) {
    try {
        entry.fn();
        console.log("ok - " + entry.name);
    } catch (error) {
        failed = true;
        console.error("not ok - " + entry.name);
        console.error(error.stack || error.message || String(error));
    }
});

if (failed) {
    process.exitCode = 1;
} else {
    console.log("All wireframe generator tests passed.");
}
