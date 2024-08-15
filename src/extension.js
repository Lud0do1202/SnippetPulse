/* ********** IMPORTS ********** */
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { askArguments } = require("./utils/arg");
const { validateSnippets } = require("./utils/validators");

/* ********** PATH ********** */
let configPath = "";

/* ********** LOAD SNIPPETS ********** */
let clientSnippets = undefined;
let lastConfigUpdate = undefined;
const loadSnippets = () => {
    const stats = fs.statSync(configPath);

    // File has not been updated
    if (clientSnippets && lastConfigUpdate && stats.mtime <= lastConfigUpdate) return clientSnippets;

    // Reload the snippets
    delete require.cache[require.resolve(configPath)];
    clientSnippets = require(configPath).snippets;

    // Validate the config
    validateSnippets(clientSnippets);

    // Update the last modified time
    lastConfigUpdate = stats.mtime;

    return clientSnippets;
};

/* ********** CONFIG ********** */
const config = vscode.commands.registerCommand("snippetpulse.config", () => {
    // Open in a tab the config file
    vscode.workspace.openTextDocument(configPath).then((doc) => {
        vscode.window.showTextDocument(doc);
    });
});

/* ********** INSERT ********** */
const insert = vscode.commands.registerCommand("snippetpulse.insert", async () => {
    try {
        // Get active editor
        const editor = vscode.window.activeTextEditor;

        // No active editor
        if (!editor) {
            throw new Error("You must have an active editor to insert a snippet.");
        }

        // Load snippets
        const clientSnippets = loadSnippets();

        // Filter snippets
        const snippets = clientSnippets.filter((snippet) => {
            // Keep those active
            if (snippet.active === false) {
                return false;
            }

            // Global snippet
            if (!snippet.regex) {
                return true;
            }

            // Keep snippets that match the regex
            return snippet.regex.test(editor.document.fileName);
        });

        // No snippets
        if (snippets.length === 0) {
            vscode.window.showInformationMessage("No snippets found.");
            return;
        }

        // Select a snippet
        const snippetNames = snippets.map((snippet) => snippet.name);
        const snippetName = await vscode.window.showQuickPick(snippetNames, {
            placeHolder: "Select a snippet to insert",
            title: "Snippet Pulse",
        });

        // Cancelled
        if (!snippetName) {
            return;
        }

        // Get the selected snippet
        const snippet = snippets.find((snippet) => snippet.name === snippetName);
        if (!snippet) {
            throw new Error("Snippet not found");
        }

        // Ask for arguments
        const args = await askArguments(snippet.args, "args", vscode);

        // Cancelled
        if (!args) {
            vscode.window.showInformationMessage("Snippet insertion cancelled.");
            return;
        }

        // Generate snippet body using the collected arguments
        const body = snippet.transform(args);
        editor.insertSnippet(new vscode.SnippetString(body.join("\n")));
    } catch (error) {
        vscode.window.showErrorMessage(error.message);
    }
});

/* ********** ACTIVATE ********** */
function activate(context) {
    // Set the config path
    configPath = context.extensionPath + "/src/config.js";

    // Create the config file if it does not exist
    if (!fs.existsSync(configPath)) {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, "const snippets = [];\n\nmodule.exports = { snippets };\n");
    }

    // Register commands
    context.subscriptions.push(config, insert);
}

/* ********** DESACTIVATE ********** */
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
