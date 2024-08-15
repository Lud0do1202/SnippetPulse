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
};

const askArgument = async (arg, prefixTitle, vscode) => {
    switch (arg.type) {
        case "input":
            return askInputArguement(arg, prefixTitle, vscode);
        case "selection":
            return askSelectionArgument(arg, prefixTitle, vscode);
        case "infinite":
            return askInfiniteArgument(arg, prefixTitle, vscode);
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

const askInfiniteArgument = async (arg, prefixTitle, vscode) => {
    const infiniteArgs = [];

    let index = 0;
    while (true) {
        // Ask for the arguments
        const args = await askArguments(arg.subargs, `${prefixTitle}.${arg.name}[${index}]`, vscode);

        // Cancelled
        if (!args) {
            return;
        }

        // Add the arguments
        infiniteArgs.push(args);

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

    return infiniteArgs;
};

module.exports = { askArguments };
