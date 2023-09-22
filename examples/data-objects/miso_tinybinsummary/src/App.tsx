/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable unicorn/prefer-string-slice */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-default-export */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-unassigned-import */
/* eslint-disable @typescript-eslint/no-floating-promises */

import React, { useState, useEffect } from "react";
import "./App.css";
import { initializeWorkspace, Workspace, copyContainer } from "./workspace";


export default function App() {
    const [workspace, setWorkspace] = useState<Workspace>();
    const [myCell, setMyCell] = useState("");
    const [copiedCell, setCopiedCell] = useState("");

    const containerId = window.location.hash.substring(1) || undefined;
    const [, setIsRender] = useState<number>(0);

    useEffect(() => {
        async function initWorkspace() {
            const myWorkspace = await initializeWorkspace(containerId);
            const first = containerId === undefined;
            if (myWorkspace.containerId && first) {
                window.location.hash = myWorkspace.containerId;
            }
            setWorkspace(myWorkspace);
            myWorkspace.tree.on("op", (event) => {
                console.log(typeof event);
                console.log("Tree op received!");
                const tree = myWorkspace.tree;
                setMyCell(tree.get());
            });

            myWorkspace.tree.on("error", (event) => {
                console.log("Tree error received!");
            });

            if (!first) {
                const tree = myWorkspace.tree;
                setMyCell(tree.get());
            }
            return myWorkspace;
        }
        initWorkspace().then((w) => {
        addBigData(w);
        addSmallData(w);
        addSmallData(w);
        addSmallData(w);
            return w;
        }).then((w) => {
        });
    }, []);

    const small = () => {
        addSmallData(workspace!);
    };

    const big = () => {
        addBigData(workspace!);
    };


    return (
        <div className="App">
            <div className="dices">
                <span className="dice" key={0}> {myCell !== undefined ? myCell.length : "NONE"}</span>
            </div>
            <div className="commit">
                <span onClick={() => { small(); }}>
                    S &nbsp;
                </span>
                <span onClick={() => { big(); }}>
                    B &nbsp;
                </span>
            </div>
            <div className="dices">
                <span className="dice" key={0}> {copiedCell !== undefined ? copiedCell.length : "NONE"}</span>
            </div>
            <div className="commit">
                <span onClick={() => { copy(workspace!, setCopiedCell); }}>
                    CP &nbsp;
                </span>
            </div>
        </div>
    );
}


function rnd(min: number, max: number) {    
    return Math.floor(Math.random() * (max - min)) + min;
}


function addSmallData(workspace: Workspace) {
    const tree = workspace.tree;
    const old: string = tree.get() ?? "";
    tree.set(old + generateData(10_000));
}

function addBigData(workspace: Workspace) {
    const tree = workspace.tree;
    const old: string = tree.get() ?? "";
    tree.set(old + generateData(70_000));
}

function copy(workspace: Workspace, setCopiedCell) {
    copyContainer(workspace.containerId!).then(
        (copied) => {
            doCopy(copied, setCopiedCell);

        }
    );    
}

function doCopy(copied, setCopiedCell) {
    const copiedCell = copied.tree;
    const copiedContent = copiedCell.get();
    setCopiedCell(
        copiedContent
        );
}

/**
 * This function generates 100kB of string data and returns it.
 * The string data should be composed of stringified sequence of numbers "1234567890".
 * The string data should be 100kB long.
 */
function generateData(nrSeq: number): string {
    let data = "";
    for (let i = 0; i < nrSeq; i++) {
        data += "1234567890";
        
    }
    return data;
}


