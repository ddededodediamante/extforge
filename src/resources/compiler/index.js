import javascriptGenerator from '../javascriptGenerator';
import util from '../util';

const dependenciesMap = {
    "Broadcasts": ["events_regbroadcast", "events_broadcast", "events_broadcastw"],
    "Variables": ["variables_"],
    "Vector": ["vector_"],
    "Utils": ["strings_amountof", "lists_set", "lists_foreach", "lists_foreachindex", "lists_foreachvalue"],
};

function getDependencies(workspace) {
    const allBlocks = workspace.getAllBlocks(false);
    if (allBlocks.length === 0) return [];

    const used = new Set();
    for (const block of allBlocks) {
        for (const [key, prefixes] of Object.entries(dependenciesMap)) {
            if (prefixes.some(p => block.type.startsWith(p))) {
                used.add(key);
            }
        }
    }
    return [...used];
}

function generateStart(dependencies) {
    let parts = [
        `if (!Scratch.extensions.unsandboxed) {
    alert("This extension needs to be unsandboxed to run!")
    return;
}
    
const ExtForge = {${dependencies.length === 0 ? '};' : ''}`,
    ];

    if (dependencies.includes("Broadcasts")) {
        parts.push(`
    Broadcasts: new function() {
        this.raw_ = {};
        this.register = (name, blocks) => {
            this.raw_[name] = blocks;
        };
        this.execute = async (name) => {
            if (this.raw_[name]) {
                await this.raw_[name]();
            };
        };
    },`);
    }

    if (dependencies.includes("Variables")) {
        parts.push(`
    Variables: new function() {
        this.raw_ = {};
        this.set = (name, value) => {
            this.raw_[name] = value;
        };
        this.get = (name) => {
            return this.raw_[name] ?? null;
        }
    },`);
    }

    if (dependencies.includes("Vector")) {
        parts.push(`
    Vector: class {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }

        static from(v) {
            if (v instanceof ExtForge.Vector) return v
            if (v instanceof Array) return new ExtForge.Vector(Number(v[0]), Number(v[1]))
            if (v instanceof Object) return new ExtForge.Vector(Number(v.x), Number(v.y))
            return new ExtForge.Vector()
        }

        add(v) {
            return new ExtForge.Vector(this.x + v.x, this.y + v.y);
        }

        set(x, y) {
            return new ExtForge.Vector(x ?? this.x, y ?? this.y)
        }
    },`);
    }

    if (dependencies.includes("Utils")) {
        parts.push(`
    Utils: {
        setList: (list, index, value) => {
            [...list][index] = value;
            return list;
        },
        lists_foreach: {
            index: [0],
            value: [null],
            depth: 0
        },
        countString: (x, y) => {
            return y.length == 0 ? 0 : x.split(y).length - 1
        }
    },`);
    }

    if (dependencies.length !== 0) parts.push(`\n};`);

    return parts.join('');
};

class Compiler {
    /**
     * Generates JavaScript code from the provided workspace & info.
     * @param {import('blockly').Workspace} workspace 
     * @param {object} properties
     * @returns {string} Generated code.
     */
    compile(workspace, properties) {
        const code = javascriptGenerator.workspaceToCode(workspace);

        const dependencies = getDependencies(workspace);
        const start = generateStart(dependencies);

        const headerCode = [
            `/*`,
            `   Created with ExtForge`,
            `   https://jwklong.github.io/extforge`,
            `*/`,
            `(async function (Scratch) {`,
            `const variables = {};`,
            ``,
            start
        ];
        const classRegistry = {
            top: [
                `class Extension {`
            ],
            extensionInfo: {},
            bottom: [
                `}`,
                ``,
                `let extension = new Extension();`,
                `// code compiled from extforge`
            ]
        }
        const footerCode = [
            `Scratch.extensions.register(extension);`,
            `})(Scratch);`
        ];

        /** turbobuilder stuff need to port over
        if (imageStates) {
            if (imageStates.icon.image) {
                // add icon uri
                const url = imageStates.icon.image;
                classRegistry.extensionInfo.blockIconURI = url;
            }
            if (imageStates.menuicon.image) {
                // add icon uri
                const url = imageStates.menuicon.image;
                classRegistry.extensionInfo.menuIconURI = url;
            }
        }**/
        classRegistry.extensionInfo.id = properties.id;
        classRegistry.extensionInfo.name = properties.name;
        classRegistry.extensionInfo.color1 = properties.color;
        classRegistry.extensionInfo.blocks = Object.entries(window.blocks ?? {}).map(([id, block]) => {
            return {
                opcode: `block_${id}`,
                text: util.blockToExtensionText(block.fields),
                blockType: block.type,
                arguments: Object.fromEntries(block.fields.filter(v => v.type !== 'label').map(v => {
                    switch (v.type) {
                        case 'string': {
                            return [v.id, {
                                type: "string",
                                defaultValue: v.default
                            }]
                        }
                        case 'number': {
                            return [v.id, {
                                type: "number",
                                defaultValue: Number(v.default) || 0
                            }]
                        }
                        case 'boolean': {
                            return [v.id, {
                                type: "Boolean"
                            }]
                        }
                    }
                }))
            }
        })

        return [].concat(headerCode, classRegistry.top, [
            `getInfo() {`,
            `   return ${JSON.stringify(classRegistry.extensionInfo).substring(0, JSON.stringify(classRegistry.extensionInfo).length - 1)}}`,
            `}`,
        ], Object.entries(window.blocks ?? {}).map(([id, block]) => {
            let blockCode = javascriptGenerator.statementToCode(
                workspace.getTopBlocks().find(v => v.type == "blocks_define" && v.blockId_ == id),
                "BLOCKS"
            )
            return `async block_${id}(args) { ${blockCode} }`
        }), classRegistry.bottom, code, footerCode).join('\n');
    }
}

export default Compiler;