import javascriptGenerator from '../javascriptGenerator';
import { registerBlock } from '../register';
import util from '../util';

const categoryPrefix = 'vector_';
const categoryColor = '#6cd';

function register() {
    registerBlock(`${categoryPrefix}create`, {
        message0: 'vector x: %1 y: %2',
        args0: [
            {
                "type": "field_number",
                "name": "X",
                "check": "Number",
                "value": 0,
                "acceptsBlocks": true
            },
            {
                "type": "field_number",
                "name": "Y",
                "check": "Number",
                "value": 0,
                "acceptsBlocks": true
            }
        ],
        output: "Vector",
        inputsInline: true,
        colour: categoryColor
    }, (block) => {
        const X = javascriptGenerator.valueToCode(block, 'X');
        const Y = javascriptGenerator.valueToCode(block, 'Y');
        const code = `new ExtForge.Vector(${X}, ${Y})`;
        return code;
    })

    registerBlock(`${categoryPrefix}x`, {
        message0: '%1 x',
        args0: [
            {
                "type": "input_value",
                "name": "VEC",
                "check": "Vector"
            },
        ],
        output: "Number",
        inputsInline: true,
        colour: categoryColor
    }, (block) => {
        const VEC = javascriptGenerator.valueToCode(block, 'VEC');
        const code = `(${VEC}).x`;
        return code;
    })

    registerBlock(`${categoryPrefix}y`, {
        message0: '%1 y',
        args0: [
            {
                "type": "input_value",
                "name": "VEC",
                "check": "Vector"
            },
        ],
        output: "Number",
        inputsInline: true,
        colour: categoryColor
    }, (block) => {
        const VEC = javascriptGenerator.valueToCode(block, 'VEC');
        const code = `(${VEC}).y`;
        return code;
    })

    registerBlock(`${categoryPrefix}add`, {
        message0: '%1 + %2',
        args0: [
            {
                "type": "input_value",
                "name": "VEC1",
                "check": "Vector"
            },
            {
                "type": "input_value",
                "name": "VEC2",
                "check": "Vector"
            },
        ],
        output: "Vector",
        inputsInline: true,
        colour: categoryColor
    }, (block) => {
        const VEC1 = javascriptGenerator.valueToCode(block, 'VEC1');
        const VEC2 = javascriptGenerator.valueToCode(block, 'VEC2');
        const code = `(${VEC1}).add(${VEC2})`;
        return code;
    })
}

export default register;