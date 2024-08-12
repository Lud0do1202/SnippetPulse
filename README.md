# Snippet Pulse

Stay in sync with the pulse of your code snippets and enhance productivity

## Desciption

**_SnippetPulse_** is a powerful tool designed to simplify the creation and insertion of code **snippets** by defining them through **JavaScript functions**.

It allows you to define snippets with **customizable arguments**, transforming them dynamically based on user input, and integrating them seamlessly into your workflow.

## Commands

### Config

The SnippetPulse configuration can be accessed through the following command:

```json
{
    "command": "snippetpulse.config",
    "title": "SnippetPulse > CONFIG"
}
```

#### Schema

```ts
const snippets = [
    {
        name: string;
        args: {
            name: string;
            placeholder?: string;
            prompt?: string;
            selection?: {
                options: [string, any][];
                canPickMany: boolean = false;
            }
        }[] = [];
        transform: (...args: any) => string[];
        regex: RegExp = global_snippet;
        active: boolean = true;
    }
];
```

| Name                           | Type                | Default              | Explanation                                                                                                                                                        |
| ------------------------------ | ------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **name**                       | string              | _required_           | The name displayed in the snippet suggestions list.                                                                                                                |
| **args**                       | array[]             | [ ]                  | The definition of all the arguments required for the snippet.                                                                                                      |
| **args.name**                  | string              | _required_           | The name displayed as the title of the argument input field.                                                                                                       |
| **args.placeholder**           | string \| undefined | undefined            | The placeholder providing a hint or example of the expected input.                                                                                                 |
| **args.prompt**                | string \| undefined | undefined            | The message displayed to help the user understand what input is required.                                                                                          |
| **args.selection**             | object \| undefined | undefined            | If the argument involves selecting from a list of predefined options, this object specifies those choices.                                                         |
| **args.selection.options**     | [string, any][]     | required             | The possible options that a user can select with the lable first and the value                                                                                     |
| **args.selection.canPickMany** | boolean             | false                | Determines whether the user can select multiple options or just one.                                                                                               |
| **transform**                  | function            | _required_           | The function that will return the final snippet. Each element of the returned array will be inserted as a line.                                                    |
| **regex**                      | RegExp \| undefined | undefined --> global | A regular expression that will check if the absolute path of the file selected by the user matches the pattern. If it does, the snippet will be available for use. |
| **active**                     | boolean             | true                 | A boolean that determines whether the snippet is available for use.                                                                                                |

#### Example

```js
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
```

### Insert

The SnippetPulse insertion can be accessed through the following command:

```json
{
    "command": "snippetpulse.insert",
    "title": "SnippetPulse > INSERT"
}
```
