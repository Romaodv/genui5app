# UI5 Generator for OpenUI5 and SAPUI5 XML Views

UI5 Generator is an OpenUI5 application that helps teams sketch SAPUI5 screens, organize layout ideas visually, and turn those wireframes into XML views faster. It combines a drag-and-drop canvas, a deterministic XML generator, and an optional AI refinement step so functional prototypes can move from idea to UI structure with much less manual effort.

This project is especially useful for developers, architects, consultants, and product teams working on SAP Fiori, OpenUI5, SAPUI5, and XML-based enterprise applications. If you are looking for a SAPUI5 wireframe generator, an OpenUI5 XML view generator, or a faster way to prototype Fiori screens, this repository is built for that workflow.

## What the project does

The app lets you assemble a screen from common UI building blocks such as:

- `Object Header`
- `Section`
- `Form`
- `Toolbar`
- `Title`
- `Text`
- `Label`
- `Input`
- `Select`
- `Date`
- `Button`
- `Table`
- `Status`

From those items, the app can:

- build a structured screen on a visual canvas
- infer common page patterns such as object pages, list reports, forms, and freestyle layouts
- generate a base SAPUI5 or OpenUI5 XML view locally
- capture a screenshot of the current wireframe
- send the canvas data, screenshot, and base XML to an AI backend for refinement
- display the returned XML so it can be reviewed and reused in UI5 projects

In practice, the local generator gives you a predictable starting point, while the AI backend can improve structure, naming, composition, or layout details based on the same wireframe context.

## How generation works

The generation flow is split into two stages:

### 1. Local deterministic generation

When the user clicks `Generate XML`, the app first sorts the canvas items by position and runs them through `WireframeXmlGenerator`. This step produces:

- a base XML view
- a detected layout pattern
- metadata about component types and required namespaces

This is the fast and predictable part of the pipeline. It works without relying on an LLM.

### 2. AI-assisted refinement

After generating the base XML, the app captures the current canvas as an image and sends a payload to the configured backend endpoint. The backend is expected to analyze the visual layout together with the structured item list and the base XML, then return an improved XML view.

That means the AI does not start from zero. It receives:

- the visual wireframe
- the structured component list
- the first-pass XML generated in the browser

This makes the backend easier to guide and usually leads to more consistent UI5 output.

## Expected AI payload

The frontend sends a `POST` request with `Content-Type: application/json` to the configured backend endpoint.

The payload has this shape:

```json
{
  "items": [
    {
      "id": 1,
      "type": "objectHeader",
      "x": 40,
      "y": 30,
      "title": "Sales Order 4711",
      "attributes": ["Customer ACME", "Open"],
      "ui5Properties": {
        "objectTitle": "Sales Order 4711",
        "objectSubtitle": "Created by John"
      }
    }
  ],
  "imgBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "xmlBase": "<mvc:View ...>...</mvc:View>"
}
```

### Field-by-field explanation

`items`

An array describing everything placed on the wireframe canvas. Each object represents one visual component and typically includes:

- `id`: unique item identifier
- `type`: component type such as `title`, `form`, `table`, `button`, or `objectHeader`
- `x`: horizontal position on the canvas
- `y`: vertical position on the canvas
- content fields depending on the component, such as `text`, `title`, `label`, `columns`, `fields`, `actions`, or `attributes`
- `ui5Properties`: optional UI5-specific properties used to enrich the generated XML

`imgBase64`

A Base64-encoded PNG screenshot of the current wireframe canvas, without the `data:image/png;base64,` prefix. This helps the backend understand the visual arrangement, spacing, grouping, and hierarchy that may not be obvious from coordinates alone.

`xmlBase`

The first XML version generated locally by the app before the backend call. This gives the AI a concrete UI5 starting point instead of forcing it to invent the full structure from scratch.

## Expected AI response

The frontend expects a JSON response containing at least:

```json
{
  "xml": "<mvc:View ...>...</mvc:View>"
}
```

If the backend returns a valid `xml` string, the app loads it into the preview flow and runs an additional check to determine whether SAPUI5-specific libraries are required.

For operational convenience, the settings screen also tests a health endpoint at:

```text
GET <backend>/health
```

## Example of a realistic `items` entry

This is a more representative example of what one wireframe item can look like:

```json
{
  "id": 7,
  "type": "table",
  "x": 40,
  "y": 620,
  "columns": ["Item", "Material", "Quantity"],
  "ui5Properties": {
    "width": "100%",
    "mode": "MultiSelect",
    "growing": true,
    "sticky": "ColumnHeaders"
  }
}
```

The exact shape varies by component type. A `button` may include `text` and `press`, a `form` may include `fields`, and an `objectHeader` may include `attributes`, `objectTitle`, and `objectSubtitle`.

## Backend authentication options

The app supports different backend modes:

- managed SaaS backend
- custom backend endpoint

Supported authentication modes are:

- `none`
- `apikey`
- `bearer`

Depending on the selected configuration, the frontend sends one of these headers:

```http
Content-Type: application/json
X-API-Key: <key>
```

or

```http
Content-Type: application/json
Authorization: Bearer <token>
```

## Information about SAPUI5 license and verification of that

Some libraries are specific to SAPUI5. As you know, UI5 is "divided" in 2: OpenUI5 (open source) and SAPUI5 (closed source). If the AI generates a XML with closed source componentes/libraries (for example, filterbars), there'll be a warning that says 'This XML requires SAPUI5 and cannot be previewed due to licensing restrictions.'. We cannot open sourced preview this XML, but the generation should consider it because the end product will be a SAPUI5 app (generally speaking).


## Result example:
![alt text](https://image2url.com/r2/default/images/1774625056091-17a1fbbf-a371-4726-a5f8-ce4afd2248cb.png "Some random result")
[img]https://image2url.com/r2/default/images/1774625056091-17a1fbbf-a371-4726-a5f8-ce4afd2248cb.png[/img]
## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend endpoint

Copy `.env.example` to `.env` and fill in the values:

```env
UI5GEN_BACKEND_ENDPOINT=
UI5GEN_BACKEND_AUTH_TYPE=apikey
```

The start, build, and QUnit scripts generate `ui5generator/webapp/appConfig.js` from those environment variables.

### 3. Start the app

```bash
npm run start:ui5generator
```

### 4. Run tests

```bash
npm test
```

## Project structure

```text
README.md
package.json
tests/
ui5generator/
  webapp/
    controller/
    service/
    utils/
    view/
    i18n/
```

Some important files:

- `ui5generator/webapp/controller/MainView.controller.js`: builds the payload and triggers generation
- `ui5generator/webapp/service/AIBackendService.js`: sends requests to the backend
- `ui5generator/webapp/utils/WireframeXmlGenerator.js`: local XML generation logic
- `ui5generator/webapp/config/AppConfig.js`: resolves managed backend configuration
- `tests/wireframe-generator.test.cjs`: validates local XML generation behavior

## Why this project is useful

A lot of UI5 projects lose time in the gap between a rough idea and a usable XML view. Screens are discussed in whiteboards, slides, tickets, and chat threads, then rebuilt by hand in SAPUI5. This project shortens that path.

It is a practical fit for teams that want to:

- prototype SAP Fiori screens more quickly
- generate OpenUI5 XML views from wireframes
- standardize how common enterprise layouts are structured
- accelerate UI implementation without giving up control of the generated XML
- combine deterministic UI generation with AI-assisted refinement

## SEO summary

This repository focuses on topics people actually search for when working with UI5:

- SAPUI5 XML view generator
- OpenUI5 wireframe tool
- SAP Fiori prototype generator
- AI-assisted SAPUI5 layout generation
- OpenUI5 visual editor for XML views
- UI5 low-code prototyping workflow

If you maintain a blog, documentation portal, internal accelerator, or demo catalog around SAP development, these are the terms this project naturally aligns with.

## Security and repository hygiene

- `ui5generator/webapp/appConfig.js` is gitignored and should not be committed with real environment values
- `.env` and `.env.local` are gitignored
- backend credentials entered in Settings stay in the browser `localStorage` for the current user
- the tracked source does not hardcode a project-specific backend endpoint

## Current scope

UI5 Generator is best understood as a prototyping and acceleration tool. It helps teams draft screens, generate a first XML version, and refine that output with backend intelligence. It is not trying to replace the full design, review, and implementation lifecycle of a production SAPUI5 application, but it does remove a lot of repetitive work at the start.
