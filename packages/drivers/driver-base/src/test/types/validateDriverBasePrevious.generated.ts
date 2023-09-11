/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by fluid-type-test-generator in @fluidframework/build-tools.
 */
import * as old from "@fluidframework/driver-base-previous";
import * as current from "../../index";

type TypeOnly<T> = {
    [P in keyof T]: TypeOnly<T[P]>;
};

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_DocumentDeltaConnection": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_DocumentDeltaConnection():
    TypeOnly<old.DocumentDeltaConnection>;
declare function use_current_ClassDeclaration_DocumentDeltaConnection(
    use: TypeOnly<current.DocumentDeltaConnection>);
use_current_ClassDeclaration_DocumentDeltaConnection(
    get_old_ClassDeclaration_DocumentDeltaConnection());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "ClassDeclaration_DocumentDeltaConnection": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_DocumentDeltaConnection():
    TypeOnly<current.DocumentDeltaConnection>;
declare function use_old_ClassDeclaration_DocumentDeltaConnection(
    use: TypeOnly<old.DocumentDeltaConnection>);
use_old_ClassDeclaration_DocumentDeltaConnection(
    get_current_ClassDeclaration_DocumentDeltaConnection());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_getW3CData": {"forwardCompat": false}
*/
declare function get_old_FunctionDeclaration_getW3CData():
    TypeOnly<typeof old.getW3CData>;
declare function use_current_FunctionDeclaration_getW3CData(
    use: TypeOnly<typeof current.getW3CData>);
use_current_FunctionDeclaration_getW3CData(
    get_old_FunctionDeclaration_getW3CData());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_getW3CData": {"backCompat": false}
*/
declare function get_current_FunctionDeclaration_getW3CData():
    TypeOnly<typeof current.getW3CData>;
declare function use_old_FunctionDeclaration_getW3CData(
    use: TypeOnly<typeof old.getW3CData>);
use_old_FunctionDeclaration_getW3CData(
    get_current_FunctionDeclaration_getW3CData());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_promiseRaceWithWinner": {"forwardCompat": false}
*/
declare function get_old_FunctionDeclaration_promiseRaceWithWinner():
    TypeOnly<typeof old.promiseRaceWithWinner>;
declare function use_current_FunctionDeclaration_promiseRaceWithWinner(
    use: TypeOnly<typeof current.promiseRaceWithWinner>);
use_current_FunctionDeclaration_promiseRaceWithWinner(
    get_old_FunctionDeclaration_promiseRaceWithWinner());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_promiseRaceWithWinner": {"backCompat": false}
*/
declare function get_current_FunctionDeclaration_promiseRaceWithWinner():
    TypeOnly<typeof current.promiseRaceWithWinner>;
declare function use_old_FunctionDeclaration_promiseRaceWithWinner(
    use: TypeOnly<typeof old.promiseRaceWithWinner>);
use_old_FunctionDeclaration_promiseRaceWithWinner(
    get_current_FunctionDeclaration_promiseRaceWithWinner());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_validateMessages": {"forwardCompat": false}
*/
declare function get_old_FunctionDeclaration_validateMessages():
    TypeOnly<typeof old.validateMessages>;
declare function use_current_FunctionDeclaration_validateMessages(
    use: TypeOnly<typeof current.validateMessages>);
use_current_FunctionDeclaration_validateMessages(
    get_old_FunctionDeclaration_validateMessages());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken:
* "FunctionDeclaration_validateMessages": {"backCompat": false}
*/
declare function get_current_FunctionDeclaration_validateMessages():
    TypeOnly<typeof current.validateMessages>;
declare function use_old_FunctionDeclaration_validateMessages(
    use: TypeOnly<typeof old.validateMessages>);
use_old_FunctionDeclaration_validateMessages(
    get_current_FunctionDeclaration_validateMessages());
