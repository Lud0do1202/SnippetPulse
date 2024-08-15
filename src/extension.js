/* ********** IMPORTS ********** */
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { askArguments } = require("./utils/arg");

/* ********** PATH ********** */
let configPath = "";

/* ********** LOAD SNIPPETS ********** */
let clientSnippets = undefined;
let lastConfigUpdate = undefined;
const loadSnippets = () => {
    const stats = fs.statSync(configPath);

    // File has not been updated
    if (clientSnippets && lastConfigUpdate && stats.mtime <= lastConfigUpdate) return clientSnippets;

    // Update the last modified time
    lastConfigUpdate = stats.mtime;

    // Reload the snippets
    delete require.cache[require.resolve(configPath)];
    clientSnippets = require(configPath).snippets;

    // Check snippets
    const checkSnippets = () => {
        // Snippets variable is not defined
        if (!clientSnippets) {
            throw new Error("snippets variable is not defined");
        }

        // Snippets variable is not an array
        if (!Array.isArray(clientSnippets)) {
            throw new Error("snippets variable must be an array");
        }

        clientSnippets.forEach((snippet, iSnippet) => {
            // Snippet is not an object
            if (typeof snippet !== "object") {
                throw new Error(`snippet[${iSnippet}] must be an object`);
            }

            // Snippet.name is missing
            if (!snippet.name) {
                throw new Error(`snippet[${iSnippet}].name is missing`);
            }

            // Snippet.name is not a string
            if (typeof snippet.name !== "string") {
                throw new Error(`snippet['${snippet.name}'].name must be of type (string)`);
            }

            // Snippet.name is missing
            if (snippet.name.trim().length === 0) {
                throw new Error(`snippet[${iSnippet}].name is missing`);
            }

            // Snippet.transform is missing
            if (!snippet.transform) {
                throw new Error(`snippet['${snippet.name}'].transform is missing`);
            }

            // Snippet.transform is not a function
            if (typeof snippet.transform !== "function") {
                throw new Error(`snippet['${snippet.name}'].transform must be of type (function)`);
            }

            // Snippet.regex? is not a RegExp
            if (snippet.regex && !(snippet.regex instanceof RegExp)) {
                throw new Error(
                    `snippet['${snippet.name}'].regex must be of type (RegExp | undefined = undefined --> global)`
                );
            }

            // Snippet.active? is not a boolean
            if (snippet.active && typeof snippet.active !== "boolean") {
                throw new Error(`snippet['${snippet.name}'].active must be of type (boolean | undefined = true)`);
            }

            // Check args
            if (snippet.args) {
                // Snippet.args is not an array
                if (!Array.isArray(snippet.args)) {
                    throw new Error(`snippet['${snippet.name}'].args must be an array`);
                }

                snippet.args.forEach((arg, iArgs) => {
                    // Snippet.arg is not an object
                    if (typeof arg !== "object") {
                        throw new Error(`snippet['${snippet.name}'].args[${iArgs}] must be an object`);
                    }

                    // Snippet.arg.name is missing
                    if (!arg.name) {
                        throw new Error(`snippet['${snippet.name}'].args[${iArgs}].name is missing`);
                    }

                    // Snippet.arg.name is missing
                    if (typeof arg.name !== "string") {
                        throw new Error(`snippet['${snippet.name}'].args[${iArgs}].name must be of type (string)`);
                    }

                    // Snippet.arg.name is missing
                    if (arg.name.trim().length === 0) {
                        throw new Error(`snippet['${snippet.name}'].args[${iArgs}].name is missing`);
                    }

                    // Check selection
                    if (arg.selection) {
                        // Snippet.arg.selection is not an object
                        if (typeof arg.selection !== "object") {
                            throw new Error(`snippet['${snippet.name}'].args[${arg.name}].selection must be an object`);
                        }

                        // Can pick many is not a boolean
                        if (arg.selection.canPickMany !== undefined && typeof arg.selection.canPickMany !== "boolean") {
                            throw new Error(
                                `snippet['${snippet.name}'].args[${arg.name}].selection.canPickMany must be of type (boolean | undefined = false)`
                            );
                        }

                        // Snippet.arg.selection.options is missing
                        if (!arg.selection.options) {
                            throw new Error(
                                `snippet['${snippet.name}'].args[${arg.name}].selection.options is missing`
                            );
                        }

                        // Snippet.arg.selection.options is not an array
                        if (!Array.isArray(arg.selection.options)) {
                            throw new Error(
                                `snippet['${snippet.name}'].args[${arg.name}].selection.options must be an array`
                            );
                        }

                        // Check options
                        arg.selection.options.forEach((option, iOption) => {
                            // Snippet.arg.selection.option is not a tuple
                            if (!Array.isArray(option) || option.length !== 2) {
                                throw new Error(
                                    `snippet['${snippet.name}'].args[${arg.name}].selection.options[${iOption}] must be a tuple of 2 elements`
                                );
                            }

                            // Lable missing
                            if (!option[0]) {
                                throw new Error(
                                    `snippet['${snippet.name}'].args[${arg.name}].selection.options[${iOption}][0 --> label] is missing`
                                );
                            }

                            // Label not a string
                            if (typeof option[0] !== "string") {
                                throw new Error(
                                    `snippet['${snippet.name}'].args[${arg.name}].selection.options[${iOption}][0 --> label] must be of type (string)`
                                );
                            }

                            // Lable missing
                            if (option[0].trim().length === 0) {
                                throw new Error(
                                    `snippet['${snippet.name}'].args[${arg.name}].selection.options[${iOption}][0 --> label] is missing`
                                );
                            }
                        });
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
        const args = await askArguments(snippet.args, "args", vscode);

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

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
