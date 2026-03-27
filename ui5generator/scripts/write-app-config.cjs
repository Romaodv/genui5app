const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "webapp", "appConfig.js");
const envPaths = [
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, "..", "..", ".env")
];

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return;
    }

    const content = fs.readFileSync(filePath, "utf8");
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            return;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

        if (key && process.env[key] === undefined) {
            process.env[key] = value;
        }
    });
}

envPaths.forEach(loadEnvFile);

function normalizeEndpoint(value) {
    return String(value || "").trim().replace(/\/+$/, "");
}

function normalizeAuthType(value) {
    const authType = String(value || "").trim().toLowerCase();
    return ["none", "apikey", "bearer"].includes(authType) ? authType : "apikey";
}

const endpoint = normalizeEndpoint(process.env.UI5GEN_BACKEND_ENDPOINT);
const authType = endpoint ? normalizeAuthType(process.env.UI5GEN_BACKEND_AUTH_TYPE) : "none";

const contents = `window.ui5generatorConfig = Object.assign(
    {},
    window.ui5generatorConfig || {},
    {
        backend: {
            endpoint: ${JSON.stringify(endpoint)},
            authType: ${JSON.stringify(authType)}
        }
    }
);
`;

fs.writeFileSync(outputPath, contents, "utf8");
