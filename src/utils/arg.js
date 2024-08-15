const askArguments = async (args, prefixTitle, vscode) => {
    const values = {};

    for (const arg of args) {
        const value = await askArgument(arg, prefixTitle, vscode);

        if (!value) {
            return;
        }

        values[arg.name] = value;
    }

    return values;

    /*
        snippets = [
            {
                name: "data",
                args: [
                    {
                        name: "typeFile",
                        type: "selection",
                        selection: {
                            options: [
                                ["JSON", { type: "json", minimal: false }],
                                ["Minimal JSON", { type: "json", minimal: true }],
                                ["XML", { type: "xml", minimal: false }],
                                ["Minimal XML", { type: "xml", minimal: true }]
                            ],
                            canPickMany: true
                        }
                    },
                    {
                        name: "root",
                        type: "input"
                    },
                    {
                        name: "attributes",
                        type: "infinte",
                        subargs: [
                            {
                                name: "attribute",
                                type: "input"
                            },
                            {
                                name: "value",
                                type: "input"
                            },
                            {
                                name: "type",
                                type: "selection",
                                selection: {
                                    options: [
                                        ["String", "string"],
                                        ["Number", "number"],
                                    ],
                                    canPickMany: false
                                }
                            }
                        ]
                    }
                ],
            }
        ]


        args = {
            "typeFile": [                           --> Selection
                { type: "json", minimal: false }, 
                { type: "xml", minimal: true }
            ],        
            "root": "Client Root",                  --> Input
            "attributes": [                         --> Infinite
                {
                    "attribute": "name",                --> Input
                    "value": "John Doe"                 --> Input
                    "type": "string"                    --> Selection
                },
                {
                    "attribute": "age",
                    "value": "30",
                    "type": "number"
                },
                {
                    "attribute": "email",
                    "value": "example@gmail.com",
                    "type": "string"
                }
            ]
        }
    */
};

const askArgument = async (arg, prefixTitle, vscode) => {
    switch (arg.type) {
        case "input":
            return askInputArguement(arg, prefixTitle, vscode);
        case "selection":
            return askSelectionArgument(arg, prefixTitle, vscode);
        case "infinte":
            return askInfinteArgument(arg, prefixTitle, vscode);
    }
};

const askInputArguement = async (arg, prefixTitle, vscode) => {
    const value = await vscode.window.showInputBox({
        title: `${prefixTitle}.${arg.name}`,
        placeHolder: arg.placeholder,
        prompt: arg.prompt,
    });

    return value;
};

const askSelectionArgument = async (arg, prefixTitle, vscode) => {
    // Get the labels
    const labels = arg.selection.options.map((option) => option[0]);

    // Show the quick pick
    const labelsSelected = await vscode.window.showQuickPick(labels, {
        title: `${prefixTitle}.${arg.name}`,
        placeHolder: arg.placeholder,
        canPickMany: arg.selection.canPickMany,
    });

    // Cancelled
    if (!labelsSelected) {
        return;
    }

    // Get the values
    const values = arg.selection.options
        .filter((option) => labelsSelected.includes(option[0]))
        .map((option) => option[1]);

    return arg.selection.canPickMany ? values : values[0];
};

const askInfinteArgument = async (arg, prefixTitle, vscode) => {
    const infinteArgs = [];

    let index = 0;
    while (true) {
        // Ask for the arguments
        const args = await askArguments(arg.subargs, `${prefixTitle}.${arg.name}[${index}]`, vscode);
        infinteArgs.push(args);

        // Ask if the user wants to add another argument
        const addAnother = await vscode.window.showQuickPick(["Yes", "No"], {
            title: arg.name,
            placeHolder: "Add another?",
        });

        if (addAnother !== "Yes") {
            break;
        }

        index++;
    }

    return infinteArgs;
};

module.exports = { askArguments };
