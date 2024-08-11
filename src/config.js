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
    {
        name: "odoo-view",
        args: [
            {
                name: "model_name",
                placeholder: "res.users",
                prompt: "Enter the model name (separators= . _-)",
            },
            {
                name: "views_type",
                prompt: "Select all the views you want to create",
                selection: {
                    values: ["form", "tree", "kanban", "search"],
                    canPickMany: true,
                },
            },
        ],
        tranform: (model_name, views_type) => viewsBody(model_name, views_type),
        regex: /(\.xml)$/,
    },
    {
        name: "odoo-action",
        args: [
            {
                name: "model_name",
                placeholder: "res.users",
                prompt: "Enter the model name (separators= . _-)",
            },
            {
                name: "views_type",
                prompt: "Select all the views you want to create",
                selection: {
                    values: ["form", "tree", "kanban", "search"],
                    canPickMany: true,
                },
            },
        ],
        tranform: (model_name, views_type) => actionBody(model_name, views_type),
        regex: /(\.xml)$/,
    },
    {
        name: "odoo-model",
        tranform: () => ["class TestPython"],
        regex: /(\.py)$/,
    },
    {
        name: "odoo-in-dev",
        tranform: () => ["In dev"],
        regex: /((\.py)|(\.json))$/,
        active: false,
    },
    {
        name: "global",
        tranform: () => ["GLOBAL"],
    },
];

module.exports = { snippets };
