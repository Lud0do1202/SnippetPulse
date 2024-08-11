/* ********** IMPORTS ********** */
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/* ********** PATH ********** */
const CONFIG_PATH = path.resolve(__dirname, "./config.js");

/* ********** SNIPPETS ********** */
let { snippets: clientSnippets } = require(CONFIG_PATH);

/* ********** LAST CONFIG UPDATE ********** */
let lastConfigUpdate = undefined;
const reloadSnippetsIfUpdated = () => {
    const stats = fs.statSync(CONFIG_PATH);

    // File has not been updated
    if (lastConfigUpdate && stats.mtime <= lastConfigUpdate) return;

    // Update the last modified time
    lastConfigUpdate = stats.mtime;

    // Reload the snippets
    delete require.cache[require.resolve(CONFIG_PATH)];
    clientSnippets = require(CONFIG_PATH).snippets;
};

/* ********** CONFIG ********** */
const config = vscode.commands.registerCommand("snippetpulse.config", () => {
    // Open in a tab the config file
    vscode.workspace.openTextDocument(CONFIG_PATH).then((doc) => {
        vscode.window.showTextDocument(doc);
    });
});

/* ********** INSERT ********** */
const insert = vscode.commands.registerCommand("snippetpulse.insert", async () => {
    // Get active editor
    const editor = vscode.window.activeTextEditor;

    // No active editor
    if (!editor) {
        vscode.window.showErrorMessage("No active editor available.");
        return;
    }

    // Filter snippets
    reloadSnippetsIfUpdated();
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
    if (!snippetName) {
        return;
    }

    // Get the selected snippet
    const snippet = snippets.find((snippet) => snippet.name === snippetName);
    if (!snippet) {
        vscode.window.showErrorMessage("Selected snippet not found.");
        return;
    }

    // Ask for arguments
    const args = [];
    for (const arg of snippet.args || []) {
        // Selection
        if (arg.selection) {
            const value = await vscode.window.showQuickPick(arg.selection.values, {
                title: arg.name,
                placeHolder: arg.placeholder,
                canPickMany: arg.selection.canPickMany,
            });

            args.push(value);
            continue;
        }

        // Input box
        const value = await vscode.window.showInputBox({
            title: arg.name,
            placeHolder: arg.placeholder,
            prompt: arg.prompt,
        });
        args.push(value);
    }

    // Check if all required arguments are provided
    if (args.some((arg) => !arg)) {
        vscode.window.showErrorMessage("All required arguments must be provided.");
        return;
    }

    // Generate snippet body using the collected arguments
    const body = snippet.tranform(...args);
    editor.insertSnippet(new vscode.SnippetString(body.join("\n")));
});

/* ********** ACTIVATE ********** */
function activate(context) {
    context.subscriptions.push(config, insert);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
