// Check snippets
const validateSnippets = (snippets) => {
    let prefix = "snippets";

    // Snippets
    if (!snippets) {
        throw new Error(`${prefix} is not defined`);
    }
    if (!Array.isArray(snippets)) {
        throw new Error(`${prefix} must be an array`);
    }

    snippets.forEach((snippet, iSnippet) => {
        const prefixIndex = `${prefix}[${iSnippet}]`;

        // Snippet
        if (typeof snippet !== "object") {
            throw new Error(`${prefixIndex} must be of type 'object'`);
        }

        // Name
        if (snippet.name === undefined) {
            throw new Error(`${prefixIndex}.name is missing`);
        }
        if (typeof snippet.name !== "string") {
            throw new Error(`${prefixIndex}.name must be of type 'string'`);
        }
        if (snippet.name.trim().length === 0) {
            throw new Error(`${prefixIndex}.name cannot be empty`);
        }

        prefix = `${prefix}['${snippet.name}']`;

        // Transform
        if (snippet.transform === undefined) {
            throw new Error(`${prefix}.transform is missing`);
        }
        if (typeof snippet.transform !== "function") {
            throw new Error(`${prefix}.transform must be of type 'function'`);
        }

        // Regex
        if (snippet.regex !== undefined && !(snippet.regex instanceof RegExp)) {
            throw new Error(`${prefix}.regex must be of type 'RegExp'`);
        }

        // Active
        if (snippet.active !== undefined && typeof snippet.active !== "boolean") {
            throw new Error(`${prefix}.active must be of type 'boolean')`);
        }

        // Args
        if (snippet.args !== undefined) {
            validateArgs(snippet.args, prefix);
        }
    });
};

const validateArgs = (args, prefix) => {
    prefix = `${prefix}.args`;

    // Args
    if (!Array.isArray(args)) {
        throw new Error(`${prefix} must be an array`);
    }

    args.forEach((arg, iArgs) => {
        const prefixIndex = `${prefix}[${iArgs}]`;

        // Arg
        if (typeof arg !== "object") {
            throw new Error(`${prefixIndex} must be of type 'object'`);
        }

        // Name
        if (arg.name === undefined) {
            throw new Error(`${prefixIndex}.name is missing`);
        }
        if (typeof arg.name !== "string") {
            throw new Error(`${prefixIndex}.name must be of type 'string'`);
        }
        if (arg.name.trim().length === 0) {
            throw new Error(`${prefixIndex}.name cannot be empty`);
        }

        prefix = `${prefix}['${arg.name}']`;

        // Type
        if (arg.type === undefined) {
            throw new Error(`${prefix}.type is missing`);
        }
        if (typeof arg.type !== "string" || !["input", "selection", "infinite"].includes(arg.type)) {
            throw new Error(`${prefix}.type must be one of ['input', 'selection', 'infinite']`);
        }

        // Selection
        if (arg.type === "selection") {
            validateSelection(arg.selection, prefix);
        }

        // Subargs
        if (arg.type === "infinite") {
            validateArgs(arg.subargs, prefix);
        }
    });
};

const validateSelection = (selection, prefix) => {
    prefix = `${prefix}.selection`;

    // Selection
    if (selection === undefined) {
        throw new Error(`${prefix} is missing`);
    }

    if (typeof selection !== "object") {
        throw new Error(`${prefix} must be of type 'object'`);
    }

    // CanPickMany
    if (selection.canPickMany !== undefined && typeof selection.canPickMany !== "boolean") {
        throw new Error(`${prefix}.canPickMany must be of type 'boolean'`);
    }

    // Options
    validateSelectionOptions(selection.options, prefix);
};

const validateSelectionOptions = (options, prefix) => {
    prefix = `${prefix}.options`;

    // Options
    if (options === undefined) {
        throw new Error(`${prefix} is missing`);
    }

    if (!Array.isArray(options)) {
        throw new Error(`${prefix} must be an array`);
    }

    options.forEach((option, iOption) => {
        prefix = `${prefix}[${iOption}]`;

        // Tuple
        if (!Array.isArray(option) || option.length !== 2) {
            throw new Error(`${prefix} must be a tuple of 2 elements`);
        }

        // Label
        if (option[0] === undefined) {
            throw new Error(`${prefix}[0 --> label] is missing`);
        }
        if (typeof option[0] !== "string") {
            throw new Error(`${prefix}[0 --> label] must be of type 'string'`);
        }
        if (option[0].trim().length === 0) {
            throw new Error(`${prefix}[0 --> label] cannot be empty`);
        }
    });
};

module.exports = { validateSnippets };
