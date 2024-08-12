const replaceSeparators = (text, separator) => {
    return text.replace(/[\\. _-]/g, separator);
};

const viewBody = (model, view) => {
    const modelLower = model.toLocaleLowerCase();
    const recordId = replaceSeparators(modelLower, "_") + "_view_" + view;
    const modelName = replaceSeparators(modelLower, ".");

    let body = [];
    body.push(`<!-- ====================  ${view.toUpperCase()}  ==================== -->`);
    body.push(`<record id="${recordId}" model="ir.ui.view">`);
    body.push(`   <field name="name">${modelName}.${view}</field>`);
    body.push(`   <field name="model">${modelName}</field>`);
    body.push(`   <field name="arch" type="xml">`);
    body.push(`       <${view}>`);
    body.push(`       </${view}>`);
    body.push(`   </field>`);
    body.push(`</record>`);
    return body;
};

const viewsBody = (model, views) => {
    let body = [];
    views.forEach((view) => {
        body.push(...viewBody(model, view), "");
    });
    return body;
};

const actionBody = (model, views) => {
    const modelLower = model.toLocaleLowerCase();
    const modelName = replaceSeparators(modelLower, ".");
    const recordId = replaceSeparators(modelLower, "_") + "_view_action";

    let body = [];
    body.push(`<!-- ====================  ACTION  ==================== -->`);
    body.push(`<record id="${recordId}" model="ir.actions.act_window">`);
    body.push(`   <field name="name">${modelName}.action</field>`);
    body.push(`   <field name="res_model">${modelName}</field>`);
    body.push(`   <field name="view_mode">${views.join(",")}</field>`);
    body.push(`</record>`);
    body.push("");

    body.push(...viewsBody(model, views));

    return body;
};

const snippets = [
    // Global snippet that replaces all separators in a text with one of the options
    {
        name: "replace-separators",
        args: [
            {
                name: "Text",
                placeholder: "word1 word2-word3.word4_word5",
                prompt: "Enter the text (separators= . _-)",
            },
            {
                name: "Separator",
                prompt: "Select the separator you want to use",
                selection: {
                    values: ["_", "-", ".", " "],
                    canPickMany: false,
                },
            },
        ],
        transform: (text, separator) => [text.replace(/[\\. _-]/g, separator)],
    },

    // Initialize a JSON file from the /dev folder with several available options.
    {
        name: "json-init",
        args: [
            {
                name: "Options",
                prompt: "Select the options you want to include",
                selection: {
                    values: ["name", "age", "city"],
                    canPickMany: true,
                },
            },
        ],
        transform: (options) => {
            let body = [];
            body.push("{");
            options.forEach((option) => {
                body.push(`    "${option}": "",`);
            });
            body.push("}");
            return body;
        },
        regex: /\/dev\/.*(\.json)$/,
    },
];

module.exports = { snippets };
