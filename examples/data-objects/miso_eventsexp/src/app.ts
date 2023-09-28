/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable unicorn/number-literal-case */
/* eslint-disable unicorn/numeric-separators-style */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable prefer-template */
/* eslint-disable unicorn/prefer-ternary */
/* eslint-disable unicorn/explicit-length-check */
/* eslint-disable eqeqeq */
/* eslint-disable unicorn/prefer-add-event-listener */
/* eslint-disable unicorn/prefer-switch */
/* eslint-disable unicorn/no-array-for-each */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable unicorn/prefer-dom-node-append */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable unicorn/prefer-dom-node-text-content */
/* eslint-disable require-atomic-updates */
/* eslint-disable unicorn/prefer-string-slice */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable unicorn/prefer-query-selector */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/order */
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TinyliciousClient } from "@fluidframework/tinylicious-client";
import {
    SharedTreeFactory,
    FieldKinds,
    AllowedUpdateType,
    EmptyKey,
    ISharedTree,
    typeNameSymbol,
    ISharedTreeView,
    EditableTree,
} from "@fluid-experimental/tree2";
import {
    hxgn,
    getSchemas,
    resolvePath,
    IResolvedPath,
    RESOLVED_PATH_TYPES,
    TypedArrayProperty,
    TypedMapProperty,
} from "./api/index";
import { BaseProperty, PropertyFactory } from "@fluid-experimental/property-properties";
import { convertPropertyToSharedTreeSchema } from "@fluid-experimental/property-shared-tree-interop";
import { DevtoolsLogger, initializeDevtools } from "@fluid-experimental/devtools";

export const diceValueKey = "dice-value-key";

const strPropSchemaName = "hxgn:StringProp-1.0.0";
const anotherStrPropSchemaName = "hxgn:AnotherStringProp-1.0.0";
const refPropSchemaName = "hxgn:RefProp-1.0.0";
const tableSchemaName = "hxgn:Table-1.0.0";
const blueCellSchemaName = "hxgn:BlueCell-1.0.0";
const cellSchemaName = "hxgn:Cell-1.0.0";
/*
const redCellSchemaName = "hxgn:RedCell-1.0.0";
const propMapSchemaName = "map<hxgn:Prop-1.0.0>";

const cellArraySchemaName = "array<hxgn:Cell-1.0.0>";
const rowSchemaName = "hxgn:Row-1.0.0";
const rowArraySchemaName = "array<hxgn:Row-1.0.0>";

*/

class MySharedTree {
    static getFactory() {
        return new SharedTreeFactory();
    }

    onDisconnect() {
        console.warn("disconnected");
    }
}

const devtoolsLogger = new DevtoolsLogger();
// Pass the logger when instantiating the AzureClient
const clientProps = {
    logger: devtoolsLogger,
};

const client = new TinyliciousClient(clientProps);

const containerSchema = {
    initialObjects: { diceMap: MySharedTree as any },
};

const root = document.getElementById("content");

const createNewDice = async () => {
    const { container } = await client.createContainer(containerSchema);

    const devtools = initializeDevtools({
        logger: devtoolsLogger,
        initialContainers: [
            {
                container,
                containerKey: "My Container",
            },
        ],
    });

    const tree = container.initialObjects.diceMap as ISharedTree;

    PropertyFactory.register(Object.values(getSchemas()));
    const fullSchemaData = convertPropertyToSharedTreeSchema(
        FieldKinds.optional,
        new Set([tableSchemaName]),
    );

    const schematizedConfig = {
        schema: fullSchemaData,
        initialTree: {
            rows: {
                [EmptyKey]: [
                    {
                        cells: { [EmptyKey]: [{ [typeNameSymbol]: blueCellSchemaName, hvalue: 1 }] },
                        optCell: { [typeNameSymbol]: cellSchemaName, hvalue: 2 },
                    },
                ],
            },
            props: {
                label: { [typeNameSymbol]: strPropSchemaName, hvalue: "Dice Table", name: "label" },
            },
        },
        allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
    };

    // A2
    const view: ISharedTreeView = tree.schematize(schematizedConfig as any);
    const id = await container.attach();
    renderDiceRoller(tree, view, root);
    return id;
};

const loadExistingDice = async (id: string) => {
    const { container } = await client.getContainer(id, containerSchema);
    // A3
    PropertyFactory.register(Object.values(getSchemas()));
    const fullSchemaData = convertPropertyToSharedTreeSchema(
        FieldKinds.optional,
        new Set([tableSchemaName]),
    );
    const tree = container.initialObjects.diceMap as ISharedTree;
    const schematizedConfig = {
        schema: fullSchemaData,
        allowedSchemaModifications: AllowedUpdateType.SchemaCompatible,
    };
    const view: ISharedTreeView = tree.schematize(schematizedConfig as any);

    renderDiceRoller(tree, view, root);
};

async function start() {
    if (location.hash) {
        await loadExistingDice(location.hash.substring(1));
    } else {
        const id = await createNewDice();
        location.hash = id;
    }
}

start().catch((error) => console.error(error));

// Define the view
const template = document.createElement("template");

template.innerHTML = `
  <style>
    h1 { text-align: center;  font-size: 50px;}
    .wrapper { text-align: left }
    .dices{ font-size: 200px }
    .prevdices{ font-size: 200px }
    .roll-buttons { font-size: 20px;}
    .del-buttons { font-size: 20px;}
    .prop-name { font-size: 20px;}
    .prop-value { font-size: 20px;}
    .prop-del { font-size: 20px; margin:0; padding:0; width: 100%; height: 100%;}
    .prop-del-cell { font-size: 20px; width: 1em;}
    .roll-button { font-size: 20px; margin:0; padding:0; width: 100%; height: 100%;}
    .del-button { font-size: 20px; margin:0; padding:0; width: 100%; height: 100%;}
    .add-blue-dice { font-size: 30px; margin:0; padding:0; width: 100%; height: 100%;}
    .add-red-dice { font-size: 30px; margin:0; padding:0; width: 100%; height: 100%;}
    .set-note { font-size: 20px; margin:0; padding: 0px 20px; width: 100%; height: 100%;}
    .set-note-another { font-size: 20px; margin:0; padding: 0px 20px; width: 100%; height: 100%;}
    .set-opt-cell { font-size: 30px; margin:0; padding:0; width: 100%; height: 100%;}
    .clear-opt-cell { font-size: 30px; margin:0; padding:0; width: 100%; height: 100%;}   
    .another-string-prop { color: red; }
    .dices-wrapper { font-size: 20px; }
    .resolve-path-1 { font-size: 20px; margin:0; padding:0; width: 100%; height: 100%;}
    .path-to-resolve-1 { font-size: 20px;}
    .resolved-path-1 { font-size: 20px;}
    .path-to-resolve-2 { font-size: 20px;}
    .resolved-path-2 { font-size: 20px;}
    .path-to-resolve-3 { font-size: 20px;}
    .resolved-path-3 { font-size: 20px;}
    .path-to-resolve-4 { font-size: 20px;}
    .resolved-path-4 { font-size: 20px;}
    .path-to-resolve-5 { font-size: 20px;}
    .resolved-path-5 { font-size: 20px;}

    .props {
        font-size: 20px;
        border-collapse: collapse; /* This will merge the borders of adjacent cells */
        width: 50%; /* Adjust the width of the table as needed */
      }
    
      .props td {
        border: 4px solid black; /* Add a 1px solid black border to each cell */
      }
  </style>
  <div class="wrapper">
  <h1>Dices and Properties</h1>
  <br>
  <br>
  <table>
    <tr>
        <td> <button class="set-note"> Set  </button> </td>
        <td> <button class="set-note-another"> Set Another </button> </td>
        <td> <input class="prop-name" placeholder="Prop Name" id="prop-name"/> </td>
        <td> <input class="prop-value" placeholder="Prop Value" id="prop-value" /> </td>
    </tr>
  </table>
  <br>
  <table class="props">
  </table>
  <br>
  <br>
  <br>
  <table class="dices-wrapper">
  <tr>
  <td><button class="add-blue-dice"> Add Blue </button></td>
  </tr>
  <tr>
  <td><button class="add-red-dice"> Add Red </button></td>
  </tr>
  <tr>
  <td><button class="set-opt-cell"> Set Opt </button></td>
  </tr>
  <tr>
  <td><button class="clear-opt-cell"> Clear Opt </button></td>
  </tr>
  <tr>
  <td> 
  <table class="tb1">
  <tr class="roll-buttons"></tr>
  <tr class="del-buttons"></tr>
  <tr class="dices"></tr>
  <tr class="prevdices"></tr>
  </table>
  </td>
  </tr>
  </table>
  <br>
  <br>
  <table>
  <tr>
  <td> <button class="resolve-path-1"> Resolve Path  </button> </td>
  </tr>
    <tr>
        <td> <input class="path-to-resolve-1" id=""path-to-resolve-1/> </td>
        <td> <input class="resolved-path-1"  id="resolved-path-1" readonly=true/> </td>
    </tr>
    <tr>
        <td> <input class="path-to-resolve-2"id="path-to-resolve-2"/> </td>
        <td> <input class="resolved-path-2"  id="resolved-path-2" readonly=true /> </td>
    </tr>
    <tr>
        <td> <input class="path-to-resolve-3"id="path-to-resolve-3"/> </td>
        <td> <input class="resolved-path-3"  id="resolved-path-3" readonly=true /> </td>
    </tr>
    <tr>
        <td> <input class="path-to-resolve-4"id="path-to-resolve-4"/> </td>
        <td> <input class="resolved-path-4"  id="resolved-path-4" readonly=true /></td>
    </tr>
    <tr>
        <td> <input class="path-to-resolve-5"id="path-to-resolve-5"/> </td>
        <td> <input class="resolved-path-5"  id="resolved-path-5" readonly=true /></td>
    </tr>
    </table>
    <br>
    <br>

  </div>
`;

const renderProperty = (prop: hxgn.Prop | undefined): HTMLElement => {
    const valElem = document.createElement("div");
    if (!prop) {
        valElem.innerText = "Not Defined";
    } else if (prop.getTypeid() === strPropSchemaName) {
        valElem.innerText = (prop as hxgn.StringProp).$hvalue;
    } else if (prop.getTypeid() === anotherStrPropSchemaName) {
        const val = (prop as hxgn.AnotherStringProp).$hvalue;
        const valElem = document.createElement("div");
        valElem.className = "another-string-prop";
        valElem.innerText = val;
        return valElem;
    } else if (prop.getTypeid() === refPropSchemaName) {
        valElem.innerText = "Ref";
    }
    return valElem;
};

const getEditableTree = (view: ISharedTreeView) => {
    const rootField = view.context.root;
    const root = rootField[0] as EditableTree;
    return root;    
};

const renderDiceRoller = (tree: any, view: ISharedTreeView, elem: any) => {
    elem.appendChild(template.content.cloneNode(true));

    const rollButtonsContainer = elem.querySelector(".roll-buttons");
    const diceRow = elem.querySelector(".dices");
    const prevdiceRow = elem.querySelector(".prevdices");
    const rollsRow = elem.querySelector(".roll-buttons");
    const delRow = elem.querySelector(".del-buttons");
    const propsTable = elem.querySelector(".props");
    const renderProps = ( elem: any) => {
        propsTable.innerHTML = "";
        // A1
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const props = table.$props;
        props.getIds().forEach((id: any) => {
            const prop = props.get(id);
            const propsRow = document.createElement("tr");
            const propNameCell = document.createElement("td");
            const propValueCell = document.createElement("td");
            propsRow.appendChild(propNameCell);
            propsRow.appendChild(propValueCell);
            propNameCell.innerHTML = `${prop?.$name}`;
            propValueCell.appendChild(renderProperty(prop));
            const propsDelCell = document.createElement("td");
            propsDelCell.className = "prop-del-cell";
            const propsDelButton = document.createElement("button");
            propsDelButton.className = "prop-del";
            propsDelButton.innerText = `x`;
            propsDelButton.onclick = () => {
                const root = getEditableTree(view);
                const table = new hxgn.Table(root, true);
                const props = table.$props;
                props.remove(id);
                renderProps(elem);
            };
            propsDelCell.appendChild(propsDelButton);
            propsRow.appendChild(propsDelCell);
            propsTable.appendChild(propsRow);
        });
    };

    const resolvedPathToString = (resolved: IResolvedPath): string => {
        let ret = "";
        if (resolved.resolvedPathType === RESOLVED_PATH_TYPES.BASE_PROPERTY) {
            ret = resolved.getTree().getTypeid();
        } else if (resolved.resolvedPathType === RESOLVED_PATH_TYPES.TYPED_ARRAY_PROPERTY) {
            const arr = resolved as unknown as TypedArrayProperty<any, any, any>;
            const arrHolder = arr.getTree().getTypeid();
            const arrField = arr.fieldKey;
            const arrlength = arr.length;
            ret = `${arrHolder}.${arrField}[${arrlength}]`;
        } else if (resolved.resolvedPathType === RESOLVED_PATH_TYPES.TYPED_MAP_PROPERTY) {
            const map = resolved as unknown as TypedMapProperty<any, any, any>;
            const mapHolder = map.getTree().getTypeid();
            const mapField = map.fieldKey;
            ret = `${mapHolder}.${mapField}`;
        } else {
            ret = resolved.toString();
        }
        return ret;
    };

    const setResolvedPaths = (elem: any) => {
        const path1input = elem.querySelector(".path-to-resolve-1");
        const path1 = path1input.value;
        const path2input = elem.querySelector(".path-to-resolve-2");
        const path2 = path2input.value;
        const path3input = elem.querySelector(".path-to-resolve-3");
        const path3 = path3input.value;
        const path4input = elem.querySelector(".path-to-resolve-4");
        const path4 = path4input.value;
        const path5input = elem.querySelector(".path-to-resolve-5");
        const path5 = path5input.value;
        const resolvedPath1 = elem.querySelector(".resolved-path-1");
        const resolvedPath2 = elem.querySelector(".resolved-path-2");
        const resolvedPath3 = elem.querySelector(".resolved-path-3");
        const resolvedPath4 = elem.querySelector(".resolved-path-4");
        const resolvedPath5 = elem.querySelector(".resolved-path-5");
        resolvedPath1.value = "";
        resolvedPath2.value = "";
        resolvedPath3.value = "";
        resolvedPath4.value = "";
        resolvedPath5.value = "";

        if (path1 == undefined || path1.length == 0) {
            return;
        }
        const resolved1 = myResolvePathFromRoot(path1);

        resolvedPath1.value = resolvedPathToString(resolved1);
        if (path2 == undefined || path2.length == 0) {
            return;
        }

        const resolved2 = myResolvePath(resolved1, path2);

        resolvedPath2.value = resolvedPathToString(resolved2);

        if (path3 == undefined || path3.length == 0) {
            return;
        }
        const resolved3 = myResolvePath(resolved2, path3);

        resolvedPath3.value = resolvedPathToString(resolved3);

        if (path4 == undefined || path4.length == 0) {
            return;
        }
        const resolved4 = myResolvePath(resolved3, path4);

        resolvedPath4.value = resolvedPathToString(resolved4);

        if (path5 == undefined || path5.length == 0) {
            return;
        }
        const resolved5 = myResolvePath(resolved4, path5);

        resolvedPath5.value = resolvedPathToString(resolved5);
    };

    // Function to create a roll button for each dice
    const createRollButton = (index: number) => {
        const rollButton = document.createElement("button");
        rollButton.className = "roll-button";
        rollButton.innerText = `Roll Dice ${index}`;
        rollButton.onclick = () => {
            const root = getEditableTree(view);
            const table = new hxgn.Table(root, true);
            const row = table.$rows.get(0);
            const cells = row.$cells;
            const type = cells.get(index).getTypeid();
            let cell: hxgn.Cell;
            if (type === blueCellSchemaName) {
                cell = hxgn.BlueCell.create({});
            } else {
                cell = hxgn.RedCell.create({});
            }
            cell.$hvalue = Math.floor(Math.random() * 6) + 1;
            if (index > 0) {
                cell.$nextCell = "../[" + (index - 1) + "]";
            }
            cells.insert(index, cell);
            const removed = cells.remove(index + 1);
        };
        return rollButton;
    };

    const createDeleteButton = (index: number) => {
        const rollButton = document.createElement("button");
        rollButton.className = "del-button";
        rollButton.innerText = `Remove Dice ${index}`;
        rollButton.onclick = () => {
            const root = getEditableTree(view);
            const table = new hxgn.Table(root, true);
            const row = table.$rows.get(0);
            const cells = row.$cells;
            cells.remove(index);
            cells.getValues().forEach((cell: { $nextCell: string }, i: number) => {
                if (i > 0) {
                    cell.$nextCell = "../[" + (i - 1) + "]";
                }
            });
        };
        return rollButton;
    };

    // Function to create a dice element
    const createDiceElement = () => {
        const dice = document.createElement("div");
        dice.className = "dice";
        return dice;
    };

    const createCell = () => {
        const dice = document.createElement("td");
        return dice;
    };

    // Set the value at our dataKey with a random number between 1 and 6 for each dice.
    const addDice = (isBlue: boolean) => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const row = table.$rows.get(0);
        const cells = row.$cells;
        const numDice = cells.length;
        let cell;
        if (isBlue) {
            cell = hxgn.BlueCell.create({});
        } else {
            cell = hxgn.RedCell.create({});
        }
        cell.$hvalue = Math.floor(Math.random() * 6) + 1;
        if (numDice > 0) {
            cell.$nextCell = "../[" + (numDice - 1) + "]";
        }
        cells.insert(numDice, cell);
        updateAll();
    };

    const setOptCell = () => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const row = table.$rows.get(0);
        const optCellVal = hxgn.Cell.create({});
        optCellVal.$hvalue = Math.floor(Math.random() * 6) + 1;
        row.$optCell = optCellVal;
        updateAll();
    };

    const myResolvePathFromRoot = (path: string): IResolvedPath => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        return myResolvePath(table, path);
    };

    const myResolvePath = (node: IResolvedPath, path: string): IResolvedPath => {
        return resolvePath(node, path);
    };

    const clearOptCell = () => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const row = table.$rows.get(0);
        row.$optCell = undefined;
        updateAll();
    };

    // Set the value at our dataKey with a random number between 1 and 6 for each dice.
    const setNote = (isAnother: boolean) => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const props = table.$props;
        const propName = document.getElementById("prop-name") as HTMLInputElement;
        const propValue = document.getElementById("prop-value") as HTMLInputElement;
        let note: hxgn.StringProp | hxgn.AnotherStringProp;
        if (isAnother) {
            note = hxgn.AnotherStringProp.create({
                name: propName.value,
                hvalue: propValue.value,
            });
        } else {
            note = hxgn.StringProp.create({
                name: propName.value,
                hvalue: propValue.value,
            });
        }
        props.set(propName.value, note);
        updateAll();
    };

    const updateAll = () => {
        renderProps(elem);
        updateDice();
    };

    // Get the current value of the shared data to update the view whenever it changes.
    const updateDice = () => {
        const root = getEditableTree(view);
        const table = new hxgn.Table(root, true);
        const row = table.$rows.get(0);
        const cells = row.$cells;
        diceRow.innerHTML = ""; // Clear existing dice elements
        prevdiceRow.innerHTML = "";
        rollsRow.innerHTML = ""; // Clear existing roll buttons
        delRow.innerHTML = ""; // Clear existing roll buttons
        const optcell = row.$optCell;
        if (optcell !== undefined) {
            const optcellElem = createCell();
            const dice = createDiceElement();
            optcellElem.appendChild(dice);
            dice.textContent = String.fromCodePoint(0x267f + row.$optCell!.$hvalue);
            dice.style.color = `hsl(${1 * 60}, 70%, 30%)`;
            rollsRow.appendChild(createCell());
            delRow.appendChild(createCell());
            diceRow.appendChild(optcellElem);
            prevdiceRow.appendChild(createCell());
        }
        const vals: any[] = cells.getValues();
        for (let i = 0; i < vals.length; i++) {
            const rollButton = createRollButton(i);
            const deleteButton = createDeleteButton(i);
            const rollcell = createCell();
            const delcell = createCell();
            rollcell.appendChild(rollButton);
            delcell.appendChild(deleteButton);
            rollsRow.appendChild(rollcell);
            delRow.appendChild(delcell);
            const cell = createCell();
            const dice = createDiceElement();
            cell.appendChild(dice);
            const type = vals[i].getTypeid();
            if (type === hxgn.BlueCell.typeid) {
                dice.style.color = `hsl(${4 * 60}, 70%, 30%)`;
            } else if (type === hxgn.RedCell.typeid) {
                dice.style.color = `hsl(${6 * 60}, 70%, 30%)`;
            }
            const val = vals[i];
            dice.textContent = String.fromCodePoint(0x267f + val.$hvalue);
            // dice.style.color = `hsl(${4 * 60}, 70%, 30%)`;
            // dice.style.color = `hsl(${vals[i].$value * 60}, 70%, 30%)`;
            diceRow.appendChild(cell);
            const prev = val.$nextCell;
            if (prev === undefined) {
                prevdiceRow.appendChild(createCell());
            } else {
                const prevcell = createCell();
                const prevdice = createDiceElement();
                prevcell.appendChild(prevdice);
                prevdice.textContent = String.fromCodePoint(0x267f + prev!.$hvalue);
                const prevtype = prev.getTypeid();
                if (prevtype === hxgn.BlueCell.typeid) {
                    prevdice.style.color = `hsl(${4 * 60}, 70%, 30%)`;
                } else if (prevtype === hxgn.RedCell.typeid) {
                    prevdice.style.color = `hsl(${6 * 60}, 70%, 30%)`;
                }
                prevdiceRow.appendChild(prevcell);
            }
        }
    };

    // Button to add a new dice
    const setNoteButton = document.querySelector(".set-note");
    (setNoteButton as any).onclick = () => {
        setNote(false);
    };
    const setNoteAnotherButton = document.querySelector(".set-note-another");
    (setNoteAnotherButton as any).onclick = () => {
        setNote(true);
    };

    // Button to add a new dice
    const addBlueButton = document.querySelector(".add-blue-dice");
    (addBlueButton as any).onclick = () => {
        addDice(true);
    };
    const addRedButton = document.querySelector(".add-red-dice");
    (addRedButton as any).onclick = () => {
        addDice(false);
    };
    const setOptButton = document.querySelector(".set-opt-cell");
    (setOptButton as any).onclick = () => {
        setOptCell();
    };

    const clearOptButton = document.querySelector(".clear-opt-cell");
    (clearOptButton as any).onclick = () => {
        clearOptCell();
    };

    const resolvePath1Button = document.querySelector(".resolve-path-1");
    (resolvePath1Button as any).onclick = () => {
        const elem = document.getElementById("content");
        setResolvedPaths(elem);
    };

    updateAll();
    view.events.on("afterBatch", updateAll);
};
