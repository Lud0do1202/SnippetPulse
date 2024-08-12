/* ********** IMPORTS ********** */
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

/* ********** PATH ********** */
let configPath = "";

/* ********** LOAD SNIPPETS ********** */
let lastConfigUpdate = undefined;
const loadSnippets = () => {
    const stats = fs.statSync(configPath);

    // File has not been updated
    if (lastConfigUpdate && stats.mtime <= lastConfigUpdate) return;

    // Update the last modified time
    lastConfigUpdate = stats.mtime;

    // Reload the snippets
    delete require.cache[require.resolve(configPath)];
    const clientSnippets = require(configPath).snippets;

    // Check snippets
    const checkSnippets = () => {
        // Check if snippets is defined
        if (!clientSnippets) {
            throw new Error("Invalid snippets found. Snippets must be defined.");
        }

        // Check if snippets is an array
        if (!Array.isArray(clientSnippets)) {
            throw new Error("Invalid snippets found. Snippets must be an array.");
        }

        clientSnippets.forEach((snippet) => {
            // Check if snippet is an object
            if (typeof snippet !== "object") {
                throw new Error("Invalid snippet found. Snippets must be objects.");
            }

            // Check if snippet has a name
            if (!snippet.name || snippet.name.trim().length === 0 || typeof snippet.name !== "string") {
                throw new Error("Invalid snippet found. Snippets must have a name.");
            }

            // Check if snippet has a transform function
            if (!snippet.transform || typeof snippet.transform !== "function") {
                throw new Error(`Snippet '${snippet.name}' does not have a transform function.`);
            }

            // Check if snippet has a regex
            if (snippet.regex && !(snippet.regex instanceof RegExp)) {
                throw new Error(`Snippet '${snippet.name}' has an invalid regex. Must be of type RegExp.`);
            }

            // Check active
            if (snippet.active && typeof snippet.active !== "boolean") {
                throw new Error(`Snippet '${snippet.name}' has an invalid active. Must be a boolean.`);
            }

            // Check args
            if (snippet.args) {
                // Check if args is an array
                if (!Array.isArray(snippet.args)) {
                    throw new Error(`Snippet '${snippet.name}' has invalid args. Must be an array.`);
                }

                snippet.args.forEach((arg) => {
                    // Check if arg is an object
                    if (typeof arg !== "object") {
                        throw new Error(`Snippet '${snippet.name}' has an invalid arg. Must be an object.`);
                    }

                    // Check if arg has a name
                    if (!arg.name || arg.name.trim().length === 0 || typeof arg.name !== "string") {
                        throw new Error(`Snippet '${snippet.name}' has an arg without a name.`);
                    }

                    // Check selection
                    if (arg.selection) {
                        // Check if selection is an object
                        if (typeof arg.selection !== "object") {
                            throw new Error(
                                `Snippet '${snippet.name}.' has an invalid selection in argument '${arg.name}'. Must be an object.`
                            );
                        }

                        // Check values exist
                        if (!arg.selection.values) {
                            throw new Error(
                                `Snippet '${snippet.name}.' has an invalid selection in argument '${arg.name}'. Must have values.`
                            );
                        }

                        // Check values is an array
                        if (!Array.isArray(arg.selection.values)) {
                            throw new Error(
                                `Snippet '${snippet.name}.' has an invalid selection in argument '${arg.name}'. Values must be an array.`
                            );
                        }

                        // Check values are strings
                        if (arg.selection.values.some((value) => typeof value !== "string")) {
                            throw new Error(
                                `Snippet '${snippet.name}.' has an invalid selection in argument '${arg.name}'. Values must be strings.`
                            );
                        }

                        // Check canPickMany
                        if (arg.selection.canPickMany && typeof arg.selection.canPickMany !== "boolean") {
                            throw new Error(
                                `Snippet '${snippet.name}.' has an invalid selection in argument '${arg.name}'. canPickMany must be a boolean.`
                            );
                        }
                    }
                });
            }
        });
    };

    checkSnippets();

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
        const args = [];
        for (const arg of snippet.args || []) {
            const value = arg.selection
                ? // Selection
                  await vscode.window.showQuickPick(arg.selection.values, {
                      title: arg.name,
                      placeHolder: arg.placeholder,
                      canPickMany: arg.selection.canPickMany,
                  })
                : // Input
                  await vscode.window.showInputBox({
                      title: arg.name,
                      placeHolder: arg.placeholder,
                      prompt: arg.prompt,
                  });

            // No value provided --> Cancelled
            if (!value) {
                return;
            }

            // Add the value to the arguments
            args.push(value);
        }

        // Generate snippet body using the collected arguments
        const body = snippet.transform(...args);
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

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
