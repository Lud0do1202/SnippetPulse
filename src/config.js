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
                    options: [
                        ["underscore (_)", "_"],
                        ["dash (-)", "-"],
                        ["dot (.)", "."],
                        ["empty space ( )", " "],
                    ],
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
                    options: [
                        ["Name", ["name", "John Doe"]],
                        ["Age", ["age", 30]],
                        ["Email", ["email", "john.doe@gmail.com"]],
                    ],
                    canPickMany: true,
                },
            },
        ],
        transform: (options) => {
            let body = [];
            body.push("{");
            options.forEach((option) => {
                body.push(`    "${option[0]}": "${option[1]}",`);
            });
            body.push("}");
            return body;
        },
        regex: /\/dev\/.*(\.json)$/,
    },
];

module.exports = { snippets };
