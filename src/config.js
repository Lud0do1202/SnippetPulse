const snippets = [
    {
        name: "data-format",
        regex: /((\.json)$)|((\.xml)$)/,
        args: [
            {
                name: "typeFiles",
                type: "selection",
                selection: {
                    options: [
                        ["JSON", { type: "json", minimal: false }],
                        ["Minimal JSON", { type: "json", minimal: true }],
                        ["XML", { type: "xml", minimal: false }],
                        ["Minimal XML", { type: "xml", minimal: true }],
                    ],
                    canPickMany: true,
                },
                prompt: "Select the type of files you want to generate",
            },
            {
                name: "root",
                type: "input",
                prompt: "Enter the root element name",
                placeholder: "data",
            },
            {
                name: "attributes",
                type: "infinite",
                subargs: [
                    {
                        name: "attribute",
                        type: "input",
                        prompt: "Enter the attribute name",
                    },
                    {
                        name: "value",
                        type: "input",
                        prompt: "Enter the attribute value",
                    },
                    {
                        name: "type",
                        type: "selection",
                        selection: {
                            options: [
                                ["String", "string"],
                                ["Number", "number"],
                                ["Array", "array"],
                            ],
                            canPickMany: false,
                        },
                        prompt: "Type of the attribute",
                    },
                ],
            },
        ],
        transform: ({ typeFiles, root, attributes }) => {
            // Convert attributes to a JSON string (minified or not)
            const toJsonString = (attrs, minimal) => {
                let data = { [root]: {} };

                for (const attr of attrs) {
                    data[root][attr.attribute] =
                        attr.type === "number"
                            ? Number(attr.value)
                            : attr.type === "array"
                            ? attr.value.trim().split(",")
                            : attr.value;
                }

                return JSON.stringify(data, null, minimal ? 0 : 2);
            };

            // Convert attributes to an XML string (minified or not)
            const toXmlString = (attrs, minimal) => {
                const nextLine = minimal ? "" : "\n";
                const nextLineAndTab = minimal ? "" : "\n\t";

                let data = `<${root}>`;
                for (const attribute of attrs) {
                    if (attribute.type === "array") {
                        const values = attribute.value.trim().split(",");
                        for (const value of values) {
                            data += `${nextLineAndTab}<${attribute.attribute}>${value}</${attribute.attribute}>`;
                        }
                    } else {
                        data += `${nextLineAndTab}<${attribute.attribute}>${
                            attribute.type === "number" ? Number(attribute.value) : attribute.value
                        }</${attribute.attribute}>`;
                    }
                }
                data += `${nextLine}</${root}>`;
                return data;
            };

            // Generate the body for each type of file
            let body = [];
            for (const typeFile of typeFiles) {
                const dataBody =
                    typeFile.type === "json"
                        ? toJsonString(attributes, typeFile.minimal)
                        : toXmlString(attributes, typeFile.minimal);
                body.push(dataBody);
            }
            return body;
        },
    },
    {
        name: "replace-separators",
        transform: ({ text, newSeparator }) => {
            return [text.replace(/[\._ -]/g, newSeparator)];
        },
        args: [
            {
                name: "text",
                type: "input",
                prompt: "Enter the text to replace the separators",
                placeholder: "H-E_L L.O",
            },
            {
                name: "newSeparator",
                type: "selection",
                prompt: "Enter the new separator",
                selection: {
                    options: [
                        ["Space", " "],
                        ["Hyphen", "-"],
                        ["Underscore", "_"],
                        ["Dot", "."],
                    ],
                    canPickMany: false,
                },
            },
        ],
    },
    {
        name: "perf-function",
        transform: ({ functionName, argNames }) => {
            let body = [];
            body.push("// --------------------------------- //");
            body.push(`let t1 = new Date().getTime()`);
            body.push(`console.log(\`Start ${functionName}: \${t1 }\`)`);
            body.push(`console.log(${functionName}(${argNames}))`);
            body.push(`let t2 = new Date().getTime()`);
            body.push(`console.log(\`End ${functionName}: \${t2 }\`)`);
            body.push(`console.log(\`Execution time ${functionName}: \${t2 - t1} ms\`)`);
            body.push("// --------------------------------- //");

            return body;
        },
        args: [
            {
                name: "functionName",
                type: "input",
                prompt: "Enter the function name",
                placeholder: "myFunction",
            },
            {
                name: "argNames",
                type: "input",
                prompt: "Enter the arguments names",
                placeholder: "arg1, arg2",
            },
        ],
    },
];

module.exports = { snippets };
