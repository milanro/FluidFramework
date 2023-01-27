/* eslint-disable jsdoc/no-bad-blocks */
/* eslint-disable jsdoc/check-indentation */
/* eslint-disable unicorn/no-array-for-each */
/* eslint-disable @typescript-eslint/restrict-plus-operands */

/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable unicorn/prefer-string-slice */
/* eslint-disable unicorn/no-for-loop */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-default-export */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-unassigned-import */
/* eslint-disable @typescript-eslint/no-floating-promises */

import {
    brand,
    SchemaData,
    emptyField,
    FieldKey,
    ValueSchema,
    EditableTree,
    FieldKindIdentifier,
    FieldSchema,
    rootFieldKey,
    getField,
    NamedTreeSchema,
    Brand,
} from "@fluid-internal/tree";
import { fieldSchema } from "@fluid-internal/tree/dist/core";
import { FullSchemaPolicy, singleTextCursor } from "@fluid-internal/tree/dist/feature-libraries";
import React, { useState, useEffect } from "react";
import "./App.css";
import { initializeWorkspace, Workspace } from "./tracking/workspace2";
import "reflect-metadata";



function convertLocalFields(local: { [key: string]: FieldSchema; }) {
    const localFields = new Map();
    // eslint-disable-next-line no-restricted-syntax
    for (const key in local) {
        if (Object.prototype.hasOwnProperty.call(local, key)) {
            localFields.set(brand(key), local[key]);
        }
    }
    return localFields;
}



const cellKey: FieldKey = brand("cell");
const rowKey: FieldKey = brand("row");
const cellValueKey: FieldKey = brand("cellValue");

const oneCellValueSchema: NamedTreeSchema = {
    name: brand("miso.CellValue-1.0.0"),
    value: ValueSchema.Number,
    localFields: new Map(),
    globalFields: new Set(),
    extraLocalFields: emptyField,
    extraGlobalFields: false,
};

let oneCellSchema: NamedTreeSchema;
let oneRowSchema: NamedTreeSchema;
let oneTableSchema: NamedTreeSchema;
let tableSchema: SchemaData;


function buildSchema(fieldKinds) {
    const [ValueFieldKind, OptionalFieldKind, SequenceFieldKind] = fieldKinds.keys();
    oneCellSchema = {
        name: brand("miso.Cell-1.0.0"),
        localFields: convertLocalFields({
            [cellValueKey]: fieldSchema({ identifier: ValueFieldKind }, [
                oneCellValueSchema.name,
            ]),
        }),
        globalFields: new Set(),
        extraLocalFields: emptyField,
        extraGlobalFields: false,
        value: ValueSchema.Nothing,
    };

    oneRowSchema = {
        name: brand("miso.Row-1.0.0"),
        localFields: convertLocalFields({
            [cellKey]: fieldSchema({ identifier: SequenceFieldKind }, [
                oneCellSchema.name,
            ]),
        }),
        globalFields: new Set(),
        extraLocalFields: emptyField,
        extraGlobalFields: false,
        value: ValueSchema.Nothing,
    };

    oneTableSchema = {
        name: brand("miso.Table-1.0.0"),
        localFields: convertLocalFields({
            [rowKey]: fieldSchema({ identifier: SequenceFieldKind }, [
                oneRowSchema.name,
            ]),
        }),
        globalFields: new Set(),
        extraLocalFields: emptyField,
        extraGlobalFields: false,
        value: ValueSchema.Nothing,
    };

    tableSchema = {
        treeSchema: new Map([
            [oneTableSchema.name, oneTableSchema],
            [oneRowSchema.name, oneRowSchema],
            [oneCellSchema.name, oneCellSchema],
            [oneCellValueSchema.name, oneCellValueSchema],
        ]),
        globalFieldSchema: new Map([
            [rootFieldKey, getRootFieldSchema(OptionalFieldKind)],
        ]),
    };

}


const tableRows = 8;
const tableCols = 12;

function genInitialTable() {
    const cellValues: any[] = [];
    const cells: any[] = [];
    const rows: any[] = [];
    for (let i = 0; i < tableCols; i++) {
        cellValues.push({
            type: oneCellValueSchema.name,
            value: 0,
        });
    }
    for (let i = 0; i < tableCols; i++) {
        cells.push({
            type: oneCellSchema.name,
            fields: {
                [cellValueKey]: [cellValues[i]],
            },
        });
    }

    for (let i = 0; i < tableRows; i++) {
        rows.push({
            type: oneRowSchema.name,
            fields: {
                [cellKey]: cells,
            },
        });
    }
    const myTable = {
        type: oneTableSchema.name,
        fields: {
            [rowKey]: rows,
        },
    };
    return myTable;
}

let initialTable;

function getColor(value: number): string {
    try {
        value % 10;
    } catch {
        return "black";
    }

    const modulo = value % 10;
    switch (modulo) {
        case 0: {
            return "grey";
        }
        case 1: {
            return "blue";
        }
        case 2: {
            return "red";
        }
        case 3: {
            return "yellow";
        }
        case 4: {
            return "darkcyan";
        }
        case 5: {
            return "firebrick";
        }
        case 6: {
            return "orange";
        }
        case 7: {
            return "purple";
        }
        case 8: {
            return "magenta";
        }
        case 9: {
            return "cyan";
        }
        default: {
            return "black";
        }
    }
}

export function getRootFieldSchema(
    fieldKind: FieldKindIdentifier
): FieldSchema {
    const rootFieldSchema = {
        kind: fieldKind,
        types: new Set([oneTableSchema.name]),
    };
    return rootFieldSchema;
}

export default function App() {
    const [workspace, setWorkspace] = useState<Workspace>();
    const [, setIsRender] = useState<number>(0);
    // const [myValue, setMyValue] = useState<number>(0);
    const containerId = window.location.hash.substring(1) || undefined;

    useEffect(() => {
        async function initWorkspace() {
            const myWorkspace = await initializeWorkspace(containerId);
            // Update location
            if (myWorkspace.containerId) {
                window.location.hash = myWorkspace.containerId;
            }
            // save workspace to react state
            setWorkspace(myWorkspace);
            buildSchema((myWorkspace.tree.storedSchema.policy as FullSchemaPolicy).fieldKinds);
            initialTable = genInitialTable();
            myWorkspace.tree.storedSchema.update(tableSchema);
            myWorkspace.tree.on("pre-op", (event) => {
                // console.log(typeof event);
                // console.log("Tree pre-op received!");
            });
            myWorkspace.tree.on("op", (event) => {
                console.log(typeof event);
                console.log("Tree op received!");
                reRender(setIsRender);
            });
            myWorkspace.tree.on("error", (event) => {
                // console.log(typeof event);
                // console.log("Tree error received!");
            });
        }
        initWorkspace();
        setIsRender(0);
    }, []);
    return (
        <div className="App">
            <h1>Shared Tree Table</h1>
            <button
                onClick={() => {
                    reRender(setIsRender);
                }}
            >
                HACK
            </button>
            <button
                onClick={() => {
                    const tree = workspace!.tree;
                    const wrappedRootField = tree.context.root;
                    wrappedRootField.insertNodes(
                        0,
                        singleTextCursor(initialTable)
                    );
                    const node0 = wrappedRootField.getNode(0);
                    console.log(node0);
                    reRender(setIsRender);
                }}
            >
                INIT SCHEMA
            </button>
            <button
                onClick={() => {
                    addRow(workspace!);
                    reRender(setIsRender);
                }}
            >
                ADD ROW
            </button>
            <button
                onClick={() => {
                    plusMultiTx(workspace!, 5, setIsRender);
                    reRender(setIsRender);
                }}
            >
                PLUS 5 (multi-tx)
            </button>
            <button
                onClick={() => {
                    play(workspace!);
                    // schemaGenerator(Table.prototype);
                }}
            >
                PLAY
            </button>
            <br></br>
            <br></br>
            <table className="mtable">
                <tbody>{renderRows(workspace, setIsRender)}</tbody>
            </table>
            <br></br>
        </div>
    );
}
/*
const RANGE_KEY = "range";
const DATA_PROPERTY_KEY = "dataProperty";
const FIELD_LIST_METADATA_KEY = Symbol("fieldList");


const cellType = Type.Object({ cellValue: Type.Number() });
const rowType = Type.Object({ cell: Type.Array(cellType) });
const tableType = Type.Object({ row: Type.Array(rowType) });


type Cell = Static<typeof cellType>;
type Row = Static<typeof rowType>;
type Table = Static<typeof tableType>;

type TableEditable = Table & EditableTree;
*/





/*


class CellProp {
    @Field("Value", String)
    color!: string;

    @Field("Value", Number)
    size!: number;

    @Field("Value", String)
    font!: string;
}

class Cell {
    @Range(0, 100)
    @Field("Value", Number)
    cellValue!: number;

    @Field("Value", CellProp)
    cellProp!: CellProp;
}

class Row {
    @Field("Sequence", Cell)
    cell!: Cell[];

}
class Table {
    @Field("Sequence", Row)
    row!: Row[];
}

type TableEditable = Table & EditableTree;

type MyType = string | MyType[] | MyTypeArray;

type MyTypeArray = MyType[];



*/


/*

function Field(multiplicity: string, clazz?: any) {
    const classProto = clazz ? clazz.prototype : undefined;
    return (target: any, propertyKey: string | symbol) => {
      Reflect.defineMetadata(FIELD_LIST_METADATA_KEY,
        [...Reflect.getMetadata(FIELD_LIST_METADATA_KEY, target) ?? [], propertyKey], target);
        Reflect.defineMetadata(DATA_PROPERTY_KEY, { classProto, propertyKey, multiplicity }, target, propertyKey);
    };
  }

function Range(from: number, to: number) {
    return Reflect.metadata(RANGE_KEY, { from, to, applyRange });
  }


  function applyRange(value: number, from: number, to: number) {
    if (value < from || value > to) {
      throw new Error(`Value ${value} is outside of range ${from}..${to}`);
    }
  }

  function getRange(target: any, propertyKey: string) {
    return Reflect.getMetadata(rangeKey, target, propertyKey);
  }
*/




function play(workspace: Workspace) {
    const table = workspace.tree.context.root.getNode(0) as TableEditable;
    const rows = table.row;
    const row: Row = rows[0];
    const cells = row.cell;
    const cell = cells[0];
    const cellValue = cell.cellValue;
    const value = cellValue;
    console.log(value);
}
/*
let intend = 0;

function genIntend() {
    let s = "";
    for (let i = 0; i < intend; i++) {
        s += "  ";
    }
    return s;
}

function schemaGenerator(typePrototype: any) {
    const keysmetadata = Reflect.getMetadata(FIELD_LIST_METADATA_KEY, typePrototype);
    if (keysmetadata !== undefined) {
        console.log(genIntend() + typePrototype.constructor.name);
        intend++;
        (keysmetadata).forEach(key => {
            const metadata = Reflect.getMetadata(DATA_PROPERTY_KEY, typePrototype, key);
            if (metadata !== undefined) {
                const moreMetadata = JSON.parse(JSON.stringify(metadata));
                moreMetadata.type = metadata.classProto?.constructor.name;
                delete moreMetadata.classProto;
                console.log(genIntend() + JSON.stringify(moreMetadata) );
                if (metadata.classProto) {
                    schemaGenerator(metadata.classProto);
                }
            }
        });
        intend--;
    }
}
*/

export type CellValue = Brand<number, "miso.CellValue"> & EditableTree;
export type Cell = EditableTree &
    Brand<{ cellValue: CellValue; }, "miso.Cell-1.0.0">;
export type Row = EditableTree & Brand<{ cell: Cell[]; }, "miso.Row-1.0.0">;
export type Table = EditableTree & Brand<{ row: Row[]; }, "miso.Table-1.0.0">;
export type TableEditable = Table;


function addRow(workspace: Workspace) {
    const tree = workspace.tree;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const cellValues: any[] = [];
        const cells: any[] = [];
        for (let i = 0; i < tableCols; i++) {
            cellValues.push({
                type: oneCellValueSchema.name,
                value: 0,
            });
        }
        for (let i = 0; i < tableCols; i++) {
            cells.push({
                type: oneCellSchema.name,
                fields: {
                    [cellValueKey]: [cellValues[i]],
                },
            });
        }
        const unwrappedRoot = tree.context.unwrappedRoot;
        const table: Table = unwrappedRoot as TableEditable;
        const rowsNr = readRowsNumber(workspace);
        const row = {
            type: oneRowSchema.name,
            fields: {
                [cellKey]: cells,
            },
        };
        const valueFieldGet = table[getField];
        const valueField = valueFieldGet(rowKey);
        const writeCursor = singleTextCursor(row);
        valueField.insertNodes(rowsNr, writeCursor);
    }
}

function renderRows(workspace: Workspace | undefined, setIsRender) {
    const reactElem: any[] = [];
    if (workspace === undefined) {
        return reactElem;
    }
    const tree = workspace.tree;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const unwrappedRoot = tree.context.unwrappedRoot;
        const table: Table = unwrappedRoot as TableEditable;
        const myRows = table.row;
        for (let rowInd = 0; rowInd < myRows.length; rowInd++) {
            reactElem.push(renderRow(workspace, rowInd, myRows[rowInd], setIsRender));
        }
        reactElem.push(renderVerticalPlusRow(workspace, setIsRender));
    }
    return reactElem;
}

function renderRow(workspace: Workspace, rowInd: number, row: Row, setIsRender) {
    const reactElem: any[] = [];
    reactElem.push(renderCells(workspace, rowInd, row, setIsRender));
    const rowElem = <tr>{reactElem}</tr>;
    return rowElem;
}

function renderCells(workspace: Workspace, rowInd: number, row: Row, setIsRender) {
    const reactElem: any[] = [];
    const myCells = row.cell;
    for (let cellInd = 0; cellInd < myCells.length; cellInd++) {
        const cell = myCells[cellInd];
        reactElem.push(renderCell(workspace, rowInd, cellInd, cell, setIsRender));
    }
    reactElem.push(renderHorizontalPlusCell(workspace, rowInd, setIsRender));
    return reactElem;
}

function renderCell(
    workspace: Workspace,
    rowInd: number,
    cellInd: number,
    cell: Cell,
    setIsRender
) {
    const reactElem: any[] = [];
    const numvalue: number = cell.cellValue;
    reactElem.push(
        <td
            style={{
                borderWidth: "6px",
                borderColor: getColor(numvalue),
                borderStyle: "solid",
                fontSize: "20px",
            }}
            className="mcell"
            onClick={() => {
                const newVal: any = cell.cellValue + 1;
                cell.cellValue = newVal;
                reRender(setIsRender);
                /*
                const valueFieldGet = cell[getField];
                const valueField = valueFieldGet(cellValueKey);
                const writeCursor = singleTextCursor({
                    type: oneCellValueSchema.name,
                    value: cell.cellValue + 1,
                });
                valueField.deleteNodes(0);
                valueField.insertNodes(0, writeCursor);
                console.log(cell.cellValue);
                */
            }}
        >
            {numvalue}
        </td>
    );
    return reactElem;
}

function readRowsNumber(workspace: Workspace) {
    const tree = workspace.tree;
    const unwrappedRoot = tree.context.unwrappedRoot;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const table: Table = unwrappedRoot as TableEditable;
        const myRows = table.row;
        return myRows.length;
    } else {
        return 0;
    }
}

function readColsNumber(workspace: Workspace) {
    const tree = workspace.tree;
    const unwrappedRoot = tree.context.unwrappedRoot;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const table: Table = unwrappedRoot as TableEditable;
        const myRows = table.row;
        return myRows[0].cell.length;
    } else {
        return 0;
    }
}

function readCellValue(workspace: Workspace, row: number, col: number) {
    const tree = workspace.tree;
    const unwrappedRoot = tree.context.unwrappedRoot;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const table: Table = unwrappedRoot as TableEditable;
        const myRows = table.row;
        return myRows[row].cell[col].cellValue;
    } else {
        return 0;
    }
}

function setCellValue(
    workspace: Workspace,
    row: number,
    col: number,
    value: number,
    setIsRender: any,
) {
    const tree = workspace.tree;
    const unwrappedRoot = tree.context.unwrappedRoot;
    const wrappedRoot = tree.context.root;
    if (wrappedRoot.length > 0) {
        const table: Table = unwrappedRoot as TableEditable;
        const myRows = table.row;
        const cell = myRows[row].cell[col];
        // const prevValue: any = cell.cellValue;
        cell.cellValue = value as any;
        /*
        const valueFieldGet = cell[getField];
        const valueField = valueFieldGet(cellValueKey);
        const writeCursor = singleTextCursor({
            type: oneCellValueSchema.name,
            value: cell.cellValue + 1,
        });
        valueField.deleteNodes(0);
        valueField.insertNodes(0, writeCursor);
        */
    } else {
        return 0;
    }
}

function renderHorizontalPlusCell(workspace: Workspace, row: number, setIsRender: any) {
    const reactElem: any[] = [];
    const colsNr = readColsNumber(workspace);
    reactElem.push(
        <td
            className="mpluscell"
            onClick={() => {
                for (let i = 0; i < colsNr; i++) {
                    const numvalue = readCellValue(workspace, row, i);
                    setCellValue(workspace, row, i, numvalue + 1, setIsRender);
                }
            }}
        >
            {"+"}
        </td>
    );
    return reactElem;
}

function renderVerticalPlusRow(workspace: Workspace, setIsRender) {
    const reactElem: any[] = [];
    reactElem.push(<tr>{renderVerticalPlusCells(workspace, setIsRender)}</tr>);
    return reactElem;
}

function renderVerticalPlusCells(workspace: Workspace, setIsRender: any) {
    const reactElem: any[] = [];
    const rowsNr = readRowsNumber(workspace);
    const colsNr = readColsNumber(workspace);
    for (let col = 0; col < colsNr; col++) {
        reactElem.push(
            <td
                className="mpluscell"
                onClick={() => {
                    for (let i = 0; i < rowsNr; i++) {
                        const numvalue = readCellValue(workspace, i, col);
                        setCellValue(workspace, i, col, numvalue + 1, setIsRender);
                    }
                }}
            >
                {"+"}
            </td>
        );
    }
    reactElem.push(renderAllPlusCell(workspace, setIsRender));
    return reactElem;
}

function renderAllPlusCell(workspace: Workspace, setIsRender: any) {
    const reactElem: any[] = [];
    const rowsNr = readRowsNumber(workspace);
    const colsNr = readColsNumber(workspace);
    reactElem.push(
        <td
            className="mpluscell"
            onClick={() => {
                for (let i = 0; i < rowsNr; i++) {
                    for (let j = 0; j < colsNr; j++) {
                        const numvalue = readCellValue(workspace, i, j);
                        setCellValue(workspace, i, j, numvalue + 1, setIsRender);
                    }
                }
            }}
        >
            {"+"}
        </td>
    );
    return reactElem;
}

function plusMultiTx(workspace: Workspace, num: number, setIsRender: any) {
    const rowsNr = readRowsNumber(workspace);
    const colsNr = readColsNumber(workspace);
    for (let k = 0; k < num; k++) {
        for (let i = 0; i < rowsNr; i++) {
            for (let j = 0; j < colsNr; j++) {
                const numvalue = readCellValue(workspace, i, j);
                setCellValue(workspace, i, j, numvalue + 1, setIsRender);
            }
        }
    }
}

/*
function plusSingleTx(workspace: Workspace, num: number, setIsRender: any) {
    workspace.tree.context.openTransaction();
    try {
        plusMultiTx(workspace, num, setIsRender);
        workspace.tree.context.commitTransaction();
    } catch (error){
        workspace.tree.context.abortTransaction();
        throw error;
    }
}
*/


function reRender(setIsRender) {
    setIsRender(2_000_000_000 * Math.random());
}
