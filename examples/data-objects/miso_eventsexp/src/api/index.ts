/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable import/export */
/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable import/order */
 
/* eslint-disable tsdoc/syntax */
/**
 * @file
 * Auto-generated TypeScript file DO NOT MODIFY.
 * Thu Sep 07 2023 08:51:01 GMT+0200 (Central European Summer Time)
 */

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
 
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
 

import {
    brand,
    UnwrappedEditableTree,
    FieldKey,
    EditableField,
    getField,
    EditableTree,
    isEditableField,
    typeNameSymbol,
    parentField,
} from "@fluid-experimental/tree2";
import schema_json from "./dds-schema.json";
import { PathHelper } from "@fluid-experimental/property-changeset";

/**
 * Get the current schema without registering
 * @return {any} DDS schema
 * @public
 */
export function getSchemas(): any {
    return schema_json;
}

const DEFAULT_TYPE_KEY: unique symbol = Symbol("default_type");

interface ITypeAware {
    [typeNameSymbol]?: string;
}

type wrapConstructorType<T, TI> = new (sharedNode: TI, isAttached: boolean) => T;
type wrapConstructorRepositoryType = { [key: string | symbol]: wrapConstructorType<any, any>; };

export enum RESOLVED_PATH_TYPES {
    BASE_PROPERTY,
    TYPED_ARRAY_PROPERTY,
    TYPED_MAP_PROPERTY,
}
export interface IResolvedPath {
    resolvedPathType: RESOLVED_PATH_TYPES;
    getTree(): BaseProperty;
    getParent(): IResolvedPath | undefined;
    isAttached(): boolean;
}

abstract class BaseProperty implements IResolvedPath {
    public constructor(
        protected readonly _sharedNode: ITypeAware,
        protected _isAttached: boolean,
    ) {}
    public static wrap<T, TI extends ITypeAware>(
        sharedNode: TI,
        constrRepository: wrapConstructorRepositoryType,
        isAttached: boolean,
    ): T {
        const typeAware = sharedNode as unknown as TI;
        const type = typeAware[typeNameSymbol];
        let constr;
        constr = type !== undefined && constrRepository[type] !== undefined ? 
        constrRepository[type] : constrRepository[DEFAULT_TYPE_KEY];
        if (constr === undefined) {
            throw new Error(`No constructor found for type: $type`);
        }
        return new constr(sharedNode, isAttached);
    }

    public isAttached(): boolean {
        return this._isAttached;
    }

    public abstract getTypeid(): string;

    public abstract get sharedNode(): ITypeAware;

    public readonly resolvedPathType: RESOLVED_PATH_TYPES = RESOLVED_PATH_TYPES.BASE_PROPERTY;

    public getTree(): BaseProperty {
        return this;
    }
    public getParent(): IResolvedPath | undefined {
        return oneUp(this);
    }
}

class ReferenceProperty<T extends BaseProperty, R extends BaseProperty> {
    public constructor(
        protected readonly _holder: T,
        protected readonly _path: string,
        protected _isAttached: boolean,
    ) {}

    public resolvePath(path: string) {
        return resolvePath(this._holder, path);
    }
    public get hvalue(): R {
        return this.resolvePath(this._path) as R;
    }
}

function oneUp(node: BaseProperty): IResolvedPath | undefined {
    const editableNode = node.sharedNode as EditableTree;
    const holdingField = editableNode[parentField].parent;
    const holdingTree = holdingField.parent;
    if (holdingTree === undefined) {
        return undefined;
    }
    const holdingType = holdingTree[typeNameSymbol];
    if (holdingType.startsWith("array<")) {
        const upperField = holdingTree[parentField].parent;
        const upperTree = upperField.parent as ITypeAware;
        return new TypedArrayProperty(upperTree, upperField.fieldKey, node.isAttached());
    } else if (holdingType.startsWith("map<")) {
        const upperField = holdingTree[parentField].parent;
        const upperTree = upperField.parent as ITypeAware;
        return new TypedMapProperty(upperTree, upperField.fieldKey, node.isAttached());
    } else {
        return BaseProperty.wrap(holdingTree, wrappedConstructors, node.isAttached());
    }
}

function toRootNode(pathElement: IResolvedPath): IResolvedPath | undefined {
    let currentNode = pathElement;
    while (currentNode !== undefined) {
        const parent = currentNode.getParent();
        if (parent === undefined) {
            return currentNode;
        }
        currentNode = parent;
    }
}

enum PATH_STEP_TYPES {
    UP,
    DOWN,
    INDEX,
    ROOT,
    DEREFERENCE,
}

export interface PathStep {
    stepType: PATH_STEP_TYPES;
}

export class UpStep implements PathStep {
    public readonly stepType: PATH_STEP_TYPES = PATH_STEP_TYPES.UP;
}

export class DownStep implements PathStep {
    public readonly stepType: PATH_STEP_TYPES = PATH_STEP_TYPES.DOWN;
    public constructor(public readonly pathElement: string) {}
}

export class IndexStep implements PathStep {
    public readonly stepType: PATH_STEP_TYPES = PATH_STEP_TYPES.INDEX;
    public constructor(public readonly index: number) {}
}

export class RootStep implements PathStep {
    public readonly stepType: PATH_STEP_TYPES = PATH_STEP_TYPES.ROOT;
}

export class DereferenceStep implements PathStep {
    public readonly stepType: PATH_STEP_TYPES = PATH_STEP_TYPES.DEREFERENCE;
}

export function parsePath(in_path: string): PathStep[] {
    const tokenTypes: PathHelper.TOKEN_TYPES[] = [];
    const pathArr = PathHelper.tokenizePathString(in_path, tokenTypes);
    const pathSteps: PathStep[] = [];
    for (let i = 0; i < pathArr.length; i++) {
        const pathElement = pathArr[i];
        if (tokenTypes[i] === PathHelper.TOKEN_TYPES.PATH_SEGMENT_TOKEN) {
            pathSteps.push(new DownStep(pathElement));
        } else if (tokenTypes[i] === PathHelper.TOKEN_TYPES.ARRAY_TOKEN) {
            pathSteps.push(new IndexStep(Number(pathElement)));
        } else if (tokenTypes[i] === PathHelper.TOKEN_TYPES.PATH_ROOT_TOKEN) {
            pathSteps.push(new RootStep());
        } else if (tokenTypes[i] === PathHelper.TOKEN_TYPES.RAISE_LEVEL_TOKEN) {
            pathSteps.push(new UpStep());
        } else if (tokenTypes[i] === PathHelper.TOKEN_TYPES.DEREFERENCE_TOKEN) {
            pathSteps.push(new DereferenceStep());
        }
    }
    return pathSteps;
}

export function resolvePath(inNode: IResolvedPath, in_path: string): IResolvedPath | any {
    let currentNode = inNode;
    const parsedPath: PathStep[] = parsePath(in_path);
    for (const step of parsedPath) {
        const movedTo = resolvePathSegment(currentNode, step);
        if (movedTo === undefined) {
            throw new Error(`Path not found: ${in_path}`);
        }
        currentNode = movedTo;
    }
    return currentNode;
}

function resolvePathSegment(
    pathNode: IResolvedPath,
    pathStep: PathStep,
): IResolvedPath | undefined | any {
    switch (pathStep.stepType) {
    case PATH_STEP_TYPES.DOWN: {
        const step: DownStep = pathStep as DownStep;
        if (pathNode.resolvedPathType === RESOLVED_PATH_TYPES.BASE_PROPERTY) {
            const fieldKey = (`$${ step.pathElement}`) as unknown as keyof IResolvedPath;
            const movedTo = pathNode[fieldKey] as unknown as IResolvedPath;
            return movedTo;
        } else if (pathNode.resolvedPathType === RESOLVED_PATH_TYPES.TYPED_MAP_PROPERTY) {
            const mapNode = pathNode as TypedMapProperty<BaseProperty, ITypeAware, ITypeAware>;
            const movedTo = mapNode.get(step.pathElement);
            return movedTo;
        }
    
    break;
    }
    case PATH_STEP_TYPES.INDEX: {
        const arrayNode = pathNode as TypedArrayProperty<BaseProperty, ITypeAware, ITypeAware>;
        const step: IndexStep = pathStep as IndexStep;
        const movedTo = arrayNode.get(step.index);
        return movedTo;
    }
    case PATH_STEP_TYPES.ROOT: {
        return toRootNode(pathNode);
    }
    case PATH_STEP_TYPES.UP: {
        return pathNode.getParent();
    }
    case PATH_STEP_TYPES.DEREFERENCE: {
        throw new Error("DEREFERENCE not implemented");
    }
    default: {
        throw new Error("Unknown path step type");
    }
    }
}

/**
 * Extended class for typed array properties.
 */
export class TypedArrayProperty<
    T extends BaseProperty,
    TI extends ITypeAware,
    TH extends ITypeAware,
> implements IResolvedPath {
    protected _wrapConstructors: wrapConstructorRepositoryType = wrappedConstructors;
    public constructor(
        protected readonly _arrayHolderNode: TH,
        protected readonly _arrayFieldKey: string,
        protected _isAttached: boolean,
    ) {}

    private toUnwrappedEditableTree(): UnwrappedEditableTree {
        return this._arrayHolderNode as unknown as UnwrappedEditableTree;
    }

    private toEditableTree(): EditableTree {
        return this._arrayHolderNode as unknown as EditableTree;
    }

    public get fieldKey(): FieldKey {
        return brand(this._arrayFieldKey);
    }

    private get fieldKeyString(): string {
        return this._arrayFieldKey;
    }
    public getTree(): BaseProperty {
        return BaseProperty.wrap(this._arrayHolderNode, this._wrapConstructors, this._isAttached);
    }

    public getParent(): IResolvedPath | undefined {
        return this.getTree();
    }

    public isAttached(): boolean {
        return this._isAttached;
    }

    private getElems(): TI[] {
        if (this._isAttached) {
            const field = this.toEditableTree()[this.fieldKey];
            if (isEditableField(field)) {
                return field as unknown as TI[];
            } else {
                throw new Error("Field is not editable");
            }
        } else {
            return (this._arrayHolderNode as any)[this.fieldKeyString] as TI[];
        }
    }

    private traverseToArrayField() {
        const getArrayValueFieldFce = this.toEditableTree()[getField] as (
            fieldKey: FieldKey,
        ) => EditableField;
        const arrayValueField: EditableField = getArrayValueFieldFce(this.fieldKey);
        const arrayNode = arrayValueField.getNode(0);
        const getFieldFce = arrayNode[getField] as (ieldKey: FieldKey) => EditableField;
        const arrayField: EditableField = getFieldFce(brand(""));
        return arrayField;
    }

    public get length(): number {
        return this.getElems().length;
    }

    public get(index: number): T {
        if (index >= this.length) {
            throw new Error("Index out of bounds");
        }
        return BaseProperty.wrap<T, TI>(
            this.getElems()[index],
            this._wrapConstructors,
            this._isAttached,
        );
    }

    public insert(in_position: number, in_value: T): void {
        if (this._isAttached) {
            const getArrayValueFieldFce = this.toEditableTree()[getField];
            const arrayValueField: EditableField = getArrayValueFieldFce(this.fieldKey);
            const arrayNode = arrayValueField.getNode(0);
            const getFieldFce = arrayNode[getField];
            const arrayField: EditableField = getFieldFce(brand(""));
            const value = { ...in_value.sharedNode };
            arrayField.insertNodes(in_position, [value as any]);
        } else {
            let elems = this.getElems();
            if (elems === undefined) {
                elems = [];
                (this._arrayHolderNode as any)[this.fieldKeyString] = elems;
            }
            const value = { ...in_value.sharedNode };
            elems.splice(in_position, 0, value as TI);
        }
    }
    /**
     * Add one or more values at the end of the array. The values can be entered as the
     * single value or as an array of values. The insert method of this class is called over
     * each of the values obtained via parameters.
     */
    public push(in_values: T[] | T): number {
        const myInputValues: T[] = !Array.isArray(in_values) ? [in_values] : in_values;
        for (const value of myInputValues) {
            this.insert(this.length, value);
        }
        return myInputValues.length;
    }
    /**
     * Add a value at the front of the array
     * It can also add multiple values to an array if you pass in an array of values.
     */
    public unshift(in_values: any[] | any): number {
        const myInputValues: any[] = !Array.isArray(in_values) ? [in_values] : in_values;
        for (const value of myInputValues.reverse()) {
            this.insert(0, value);
        }
        return in_values.length;
    }
    /**
     * Removes an element of the array (or a letter in a StringProperty) and shifts remaining elements to the left
     * E.g. [1, 2, 3]   .remove(1) => [1, 3]
     * E.g. (StringProperty) 'ABCDE'  .remove(1) => 'ACDE'
     */
    public remove(in_position: number): T | any {
        if (this._isAttached) {
            const arrayField: EditableField = this.traverseToArrayField();
            const node = arrayField.getNode(in_position);
            const removed = BaseProperty.wrap<T, TI>(
                node as unknown as TI,
                this._wrapConstructors,
                this._isAttached,
            );
            arrayField.removeNodes(in_position, 1);
            return removed;
        } else {
            const elems = this.getElems();
            const node = elems[in_position];
            delete elems[in_position];
            return node;
        }
    }
    /**
     * Removes the last element of the array
     */
    public pop(): T | any {
        return this.remove(this.length - 1);
    }
    /**
     * Removes an element from the front of the array
     */
    public shift(): T | any {
        return this.remove(0);
    }
    /**
     * Change an existing element of the array. This will overwrite an existing element.
     * E.g. [1, 2, 3]  .set(1, 8) => [1, 8, 3]
     */
    public set(in_position: number, in_value: any): void {
        this.insert(in_position, in_value);
        this.remove(in_position + 1);
    }

    /**
     * Deletes all values from an array
     */
    public clear(): void {
        const lengthAtStart = this.length;
        for (let i = 0; i < lengthAtStart; i++) {
            this.remove(0);
        }
    }

    public insertRange(in_offset: number, range: T[]): void {
        for (const [i, element] of range.entries()) {
            this.insert(in_offset + i, element);
        }
    }

    /**
     * Removes a given number of elements from the array property (or given number of letters from a StringProperty)
     * and shifts remaining values to the left.
     * E.g. [1, 2, 3, 4, 5]  .removeRange(1, 3) => [1, 5]
     */
    public removeRange(in_offset: number, in_deleteCount: number): any[] | T[] {
        const removedElements: any[] = [];
        for (let i = 0; i < in_deleteCount; i++) {
            removedElements.push(this.remove(in_offset));
        }
        return removedElements;
    }

    /**
     * Sets the array properties elements to the content of the given array
     * All changed elements must already exist. This will overwrite existing elements.
     * E.g. [1, 2, 3, 4, 5]  .setRange(1, [7, 8]) => [1, 7, 8, 4, 5]
     */
    public setRange(in_offset: number, in_array: any[]): void {
        for (let i = 0; i < in_array.length; i++) {
            this.set(in_offset + i, in_array[i]);
        }
    }
    /**
     * Returns an object with all the nested values contained in this property
     */
    public getValues<R = T[]>(): R | any {
        const pureVals = [...this.getElems()];
        return pureVals.map((val) => {
            return BaseProperty.wrap<T, TI>(val, this._wrapConstructors, this._isAttached);
        });
    }
    public getLength(): number {
        return this.length;
    }
    /**
     * Checks whether a property or data exists at the given position.
     * @param in_position - index of the property
     */
    public has(in_position: number): boolean {
        return this.getElems()[in_position] !== undefined;
    }

    public readonly resolvedPathType: RESOLVED_PATH_TYPES =
        RESOLVED_PATH_TYPES.TYPED_ARRAY_PROPERTY;
}

export class TypedMapProperty<T extends BaseProperty, TI extends ITypeAware, TH extends ITypeAware>
    implements IResolvedPath {
    protected _wrapConstructors: wrapConstructorRepositoryType = wrappedConstructors;
    public constructor(
        protected readonly _holderNode: TH,
        protected readonly _fieldKey: string,
        protected _isAttached: boolean,
    ) {}

    private toEditableTree(): EditableTree {
        return this._holderNode as unknown as EditableTree;
    }

    public get fieldKey(): FieldKey {
        return brand(this._fieldKey);
    }

    private traverseToMapField() {
        const getArrayValueFieldFce = this.toEditableTree()[getField] as (
            fieldKey: FieldKey,
        ) => EditableField;
        const mapField: EditableField = getArrayValueFieldFce(this.fieldKey);
        return mapField;
    }

    public getTree(): BaseProperty {
        return BaseProperty.wrap(this._holderNode, this._wrapConstructors, this._isAttached);
    }

    public getParent(): IResolvedPath | undefined {
        return this.getTree();
    }

    public isAttached(): boolean {
        return this._isAttached;
    }

    public get(key: string): T | undefined {
        if (this._isAttached) {
            const mapField = this.traverseToMapField();
            if (mapField.length === 0) {
                return undefined;
            }
            const mapNode = mapField.getNode(0);
            const getFieldFce = mapNode[getField] as (fieldKey: FieldKey) => EditableField;
            const keyField = getFieldFce(brand(key));
            if (keyField.length === 0) {
                return undefined;
            } else {
                const node = keyField.getNode(0);
                return BaseProperty.wrap<T, TI>(
                    node as unknown as TI,
                    this._wrapConstructors,
                    this._isAttached,
                );
            }
        } else {
            const node = (this._holderNode as any)[this._fieldKey][key];
            return BaseProperty.wrap<T, TI>(node, this._wrapConstructors, this._isAttached);
        }
    }

    public set(key: string, value: T): void {
        if (this._isAttached) {
            const mapField = this.traverseToMapField();
            if (mapField.length === 0) {
                mapField.setContent({});
            }
            const mapNode = mapField.getNode(0);
            const getFieldFce = mapNode[getField] as (fieldKey: FieldKey) => EditableField;
            const keyField = getFieldFce(brand(key));
            keyField.setContent(value.sharedNode as any);
        } else {
            (this._holderNode as any)[this._fieldKey][key] = value;
        }
    }

    public insert(key: string, value: T): void {
        const present = this.get(key) != undefined;
        if (present) {
            throw new Error("Key already present");
        }
        this.set(key, value);
    }

    public remove(key: string): T | undefined {
        const value = this.get(key);
        if (value == undefined) {
            return undefined;
        }
        if (this._isAttached) {
            const mapField = this.traverseToMapField();
            if (mapField.length === 0) {
                return undefined;
            }
            const mapNode = mapField.getNode(0);
            const getFieldFce = mapNode[getField] as (fieldKey: FieldKey) => EditableField;
            const keyField = getFieldFce(brand(key));
            keyField.remove();
        } else {
            delete (this._holderNode as any)[this._fieldKey][key];
        }
        return value;
    }

    public getIds(): string[] {
        const mapField = this.traverseToMapField();
        if (mapField.length === 0) {
            return [];
        }
        const mapNode = mapField.getNode(0);
        return Object.keys(mapNode);
    }

    public has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    public getAsArray(): T[] {
        const mapField = this.traverseToMapField();
        if (mapField.length === 0) {
            return [];
        }
        const mapNode = mapField.getNode(0);
        const keys = Object.keys(mapNode);
        const getFieldFce = mapNode[getField] as (fieldKey: FieldKey) => EditableField;
        return keys.map((key) => {
            const keyField = getFieldFce(brand(key));
            const node = keyField.getNode(0);
            return BaseProperty.wrap<T, TI>(
                node as unknown as TI,
                this._wrapConstructors,
                this._isAttached,
            );
        });
    }

    public readonly resolvedPathType: RESOLVED_PATH_TYPES = RESOLVED_PATH_TYPES.TYPED_MAP_PROPERTY;
}

export namespace dds {
    /**
     * Property DDS numeric field that behaves like a c-type Int8.
     * @public
     */
    export type Int8 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Int16.
     * @public
     */
    export type Int16 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Int32.
     * @public
     */
    export type Int32 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Int64.
     * @public
     */
    export type Int64 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Uint8.
     * @public
     */
    export type Uint8 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Uint16.
     * @public
     */
    export type Uint16 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Uint32.
     * @public
     */
    export type Uint32 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Uint64.
     * @public
     */
    export type Uint64 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Float32.
     * @public
     */
    export type Float32 = number;

    /**
     * Property DDS numeric field that behaves like a c-type Float64.
     * @public
     */
    export type Float64 = number;
} // namespace dds

export namespace hxgn {
    /**
     * hxgn:Prop-1.0.0
     *
     * Property
     * @public
     */
    export interface IValueProp_1_0_0 extends ITypeAware {
        name?: string;
    }

    /**
     * hxgn:Prop-1.0.0
     *
     * Property
     * @public
     */
    export class Prop_1_0_0 extends BaseProperty {
        static typeid = "hxgn:Prop-1.0.0";
        getTypeid() {
            return "hxgn:Prop-1.0.0";
        }

        public static create(data: IValueProp_1_0_0): Prop_1_0_0 {
            data[typeNameSymbol] = "hxgn:Prop-1.0.0";
            return BaseProperty.wrap<Prop_1_0_0, IValueProp_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: Prop_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueProp_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                name: "name",
            };
        }

        get $name() {
            return this.sharedNode.name!;
        }
        set $name(v: string) {
            this.sharedNode.name = v;
        }
    }

    /**
     * Alias for hxgn:Prop-1.0.0
     *
     * Property
     * @public
     */
    export type Prop = InstanceType<typeof Prop_1_0_0>;

    /**
     * Alias for hxgn:Prop-1.0.0
     *
     * Property
     * @public
     */
    export type IValueProp = IValueProp_1_0_0;

    /**
     * Alias for Prop_1_0_0
     *
     * Property
     * @public
     */
    export const Prop = Prop_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:RefProp-1.0.0
     *
     * @public
     */
    export interface IValueRefProp_1_0_0 extends IValueProp_1_0_0, ITypeAware {
        path?: string;
    }

    /**
     * hxgn:RefProp-1.0.0
     *
     * @public
     */
    export class RefProp_1_0_0 extends Prop_1_0_0 {
        static typeid = "hxgn:RefProp-1.0.0";
        getTypeid() {
            return "hxgn:RefProp-1.0.0";
        }

        public static create(data: IValueRefProp_1_0_0): RefProp_1_0_0 {
            data[typeNameSymbol] = "hxgn:RefProp-1.0.0";
            return BaseProperty.wrap<RefProp_1_0_0, IValueRefProp_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: RefProp_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueRefProp_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                ...Prop_1_0_0.fieldName,
                path: "path",
            };
        }

        get $path() {
            return this.sharedNode.path!;
        }
        set $path(v: string) {
            this.sharedNode.path = v;
        }
    }

    /**
     * Alias for hxgn:RefProp-1.0.0
     *
     * @public
     */
    export type RefProp = InstanceType<typeof RefProp_1_0_0>;

    /**
     * Alias for hxgn:RefProp-1.0.0
     *
     * @public
     */
    export type IValueRefProp = IValueRefProp_1_0_0;

    /**
     * Alias for RefProp_1_0_0
     *
     * @public
     */
    export const RefProp = RefProp_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:Cell-1.0.0
     *
     * Cell Data
     * @public
     */
    export interface IValueCell_1_0_0 extends ITypeAware {
        hvalue?: dds.Int32;
        nextCell?: string;
    }

    /**
     * hxgn:Cell-1.0.0
     *
     * Cell Data
     * @public
     */
    export class Cell_1_0_0 extends BaseProperty {
        static typeid = "hxgn:Cell-1.0.0";
        getTypeid() {
            return "hxgn:Cell-1.0.0";
        }

        public static create(data: IValueCell_1_0_0): Cell_1_0_0 {
            data[typeNameSymbol] = "hxgn:Cell-1.0.0";
            return BaseProperty.wrap<Cell_1_0_0, IValueCell_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: Cell_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueCell_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                hvalue: "hvalue",
                nextCell: "nextCell",
            };
        }

        get $hvalue() {
            return this.sharedNode.hvalue!;
        }
        set $hvalue(v: dds.Int32) {
            this.sharedNode.hvalue = v;
        }
        get $nextCell() {
            return this.sharedNode.nextCell !== undefined ? resolvePath(this, this.sharedNode.nextCell) : undefined;
        }
        get $nextCell$ref() {
            return new ReferenceProperty<Cell_1_0_0, Cell_1_0_0>(
                this,
                "nextCell",
                this.isAttached(),
            );
        }
        set $nextCell(v: string | undefined) {
            this.sharedNode.nextCell = v;
        }
    }

    /**
     * Alias for hxgn:Cell-1.0.0
     *
     * Cell Data
     * @public
     */
    export type Cell = InstanceType<typeof Cell_1_0_0>;

    /**
     * Alias for hxgn:Cell-1.0.0
     *
     * Cell Data
     * @public
     */
    export type IValueCell = IValueCell_1_0_0;

    /**
     * Alias for Cell_1_0_0
     *
     * Cell Data
     * @public
     */
    export const Cell = Cell_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:RedCell-1.0.0
     *
     * @public
     */
    export interface IValueRedCell_1_0_0 extends IValueCell_1_0_0, ITypeAware {
        red?: dds.Int32;
    }

    /**
     * hxgn:RedCell-1.0.0
     *
     * @public
     */
    export class RedCell_1_0_0 extends Cell_1_0_0 {
        static typeid = "hxgn:RedCell-1.0.0";
        getTypeid() {
            return "hxgn:RedCell-1.0.0";
        }

        public static create(data: IValueRedCell_1_0_0): RedCell_1_0_0 {
            data[typeNameSymbol] = "hxgn:RedCell-1.0.0";
            return BaseProperty.wrap<RedCell_1_0_0, IValueRedCell_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: RedCell_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueRedCell_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                ...Cell_1_0_0.fieldName,
                red: "red",
            };
        }

        get $red() {
            return this.sharedNode.red!;
        }
        set $red(v: dds.Int32) {
            this.sharedNode.red = v;
        }
    }

    /**
     * Alias for hxgn:RedCell-1.0.0
     *
     * @public
     */
    export type RedCell = InstanceType<typeof RedCell_1_0_0>;

    /**
     * Alias for hxgn:RedCell-1.0.0
     *
     * @public
     */
    export type IValueRedCell = IValueRedCell_1_0_0;

    /**
     * Alias for RedCell_1_0_0
     *
     * @public
     */
    export const RedCell = RedCell_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:AnotherStringProp-1.0.0
     *
     * @public
     */
    export interface IValueAnotherStringProp_1_0_0 extends IValueProp_1_0_0, ITypeAware {
        hvalue?: string;
    }

    /**
     * hxgn:AnotherStringProp-1.0.0
     *
     * @public
     */
    export class AnotherStringProp_1_0_0 extends Prop_1_0_0 {
        static typeid = "hxgn:AnotherStringProp-1.0.0";
        getTypeid() {
            return "hxgn:AnotherStringProp-1.0.0";
        }

        public static create(data: IValueAnotherStringProp_1_0_0): AnotherStringProp_1_0_0 {
            data[typeNameSymbol] = "hxgn:AnotherStringProp-1.0.0";
            return BaseProperty.wrap<AnotherStringProp_1_0_0, IValueAnotherStringProp_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: AnotherStringProp_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueAnotherStringProp_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                ...Prop_1_0_0.fieldName,
                hvalue: "hvalue",
            };
        }

        get $hvalue() {
            return this.sharedNode.hvalue!;
        }
        set $hvalue(v: string) {
            this.sharedNode.hvalue = v;
        }
    }

    /**
     * Alias for hxgn:AnotherStringProp-1.0.0
     *
     * @public
     */
    export type AnotherStringProp = InstanceType<typeof AnotherStringProp_1_0_0>;

    /**
     * Alias for hxgn:AnotherStringProp-1.0.0
     *
     * @public
     */
    export type IValueAnotherStringProp = IValueAnotherStringProp_1_0_0;

    /**
     * Alias for AnotherStringProp_1_0_0
     *
     * @public
     */
    export const AnotherStringProp = AnotherStringProp_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:Row-1.0.0
     *
     * Row Data
     * @public
     */
    export interface IValueRow_1_0_0 extends ITypeAware {
        cells?: IValueCell_1_0_0[];
        optCell?: IValueCell_1_0_0;
    }

    /**
     * hxgn:Row-1.0.0
     *
     * Row Data
     * @public
     */
    export class Row_1_0_0 extends BaseProperty {
        static typeid = "hxgn:Row-1.0.0";
        getTypeid() {
            return "hxgn:Row-1.0.0";
        }

        public static create(data: IValueRow_1_0_0): Row_1_0_0 {
            data[typeNameSymbol] = "hxgn:Row-1.0.0";
            return BaseProperty.wrap<Row_1_0_0, IValueRow_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: Row_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueRow_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                cells: "cells",
                optCell: "optCell",
            };
        }

        get $cells() {
            return new TypedArrayProperty<Cell_1_0_0, IValueCell_1_0_0, IValueRow_1_0_0>(
                this._sharedNode,
                "cells",
                this.isAttached(),
            );
        }
        get $optCell(): Cell_1_0_0 | undefined {
            return this.sharedNode.optCell === undefined ? undefined : BaseProperty.wrap<Cell_1_0_0, IValueCell_1_0_0>(
                    this.sharedNode.optCell,
                    wrappedConstructors,
                    this.isAttached(),
                );
        }
        set $optCell(v: Cell_1_0_0 | undefined) {
            this.sharedNode.optCell = v?.sharedNode;
        }
    }

    /**
     * Alias for hxgn:Row-1.0.0
     *
     * Row Data
     * @public
     */
    export type Row = InstanceType<typeof Row_1_0_0>;

    /**
     * Alias for hxgn:Row-1.0.0
     *
     * Row Data
     * @public
     */
    export type IValueRow = IValueRow_1_0_0;

    /**
     * Alias for Row_1_0_0
     *
     * Row Data
     * @public
     */
    export const Row = Row_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:StringProp-1.0.0
     *
     * @public
     */
    export interface IValueStringProp_1_0_0 extends IValueProp_1_0_0, ITypeAware {
        hvalue?: string;
    }

    /**
     * hxgn:StringProp-1.0.0
     *
     * @public
     */
    export class StringProp_1_0_0 extends Prop_1_0_0 {
        static typeid = "hxgn:StringProp-1.0.0";
        getTypeid() {
            return "hxgn:StringProp-1.0.0";
        }

        public static create(data: IValueStringProp_1_0_0): StringProp_1_0_0 {
            data[typeNameSymbol] = "hxgn:StringProp-1.0.0";
            return BaseProperty.wrap<StringProp_1_0_0, IValueStringProp_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: StringProp_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueStringProp_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                ...Prop_1_0_0.fieldName,
                hvalue: "hvalue",
            };
        }

        get $hvalue() {
            return this.sharedNode.hvalue!;
        }
        set $hvalue(v: string) {
            this.sharedNode.hvalue = v;
        }
    }

    /**
     * Alias for hxgn:StringProp-1.0.0
     *
     * @public
     */
    export type StringProp = InstanceType<typeof StringProp_1_0_0>;

    /**
     * Alias for hxgn:StringProp-1.0.0
     *
     * @public
     */
    export type IValueStringProp = IValueStringProp_1_0_0;

    /**
     * Alias for StringProp_1_0_0
     *
     * @public
     */
    export const StringProp = StringProp_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:BlueCell-1.0.0
     *
     * @public
     */
    export interface IValueBlueCell_1_0_0 extends IValueCell_1_0_0, ITypeAware {
        blue?: dds.Int32;
    }

    /**
     * hxgn:BlueCell-1.0.0
     *
     * @public
     */
    export class BlueCell_1_0_0 extends Cell_1_0_0 {
        static typeid = "hxgn:BlueCell-1.0.0";
        getTypeid() {
            return "hxgn:BlueCell-1.0.0";
        }

        public static create(data: IValueBlueCell_1_0_0): BlueCell_1_0_0 {
            data[typeNameSymbol] = "hxgn:BlueCell-1.0.0";
            return BaseProperty.wrap<BlueCell_1_0_0, IValueBlueCell_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: BlueCell_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueBlueCell_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                ...Cell_1_0_0.fieldName,
                blue: "blue",
            };
        }

        get $blue() {
            return this.sharedNode.blue!;
        }
        set $blue(v: dds.Int32) {
            this.sharedNode.blue = v;
        }
    }

    /**
     * Alias for hxgn:BlueCell-1.0.0
     *
     * @public
     */
    export type BlueCell = InstanceType<typeof BlueCell_1_0_0>;

    /**
     * Alias for hxgn:BlueCell-1.0.0
     *
     * @public
     */
    export type IValueBlueCell = IValueBlueCell_1_0_0;

    /**
     * Alias for BlueCell_1_0_0
     *
     * @public
     */
    export const BlueCell = BlueCell_1_0_0;
} // end export namespace hxgn {

export namespace hxgn {
    /**
     * hxgn:Table-1.0.0
     *
     * Table Data
     * @public
     */
    export interface IValueTable_1_0_0 extends ITypeAware {
        rows?: IValueRow_1_0_0[];
        props?: { [key: string]: IValueProp_1_0_0; };
    }

    /**
     * hxgn:Table-1.0.0
     *
     * Table Data
     * @public
     */
    export class Table_1_0_0 extends BaseProperty {
        static typeid = "hxgn:Table-1.0.0";
        getTypeid() {
            return "hxgn:Table-1.0.0";
        }

        public static create(data: IValueTable_1_0_0): Table_1_0_0 {
            data[typeNameSymbol] = "hxgn:Table-1.0.0";
            return BaseProperty.wrap<Table_1_0_0, IValueTable_1_0_0>(
                data,
                { [DEFAULT_TYPE_KEY]: Table_1_0_0 },
                false,
            );
        }

        /**
         * This method casts the _sharedNode Editable Tree into the custom type interface.
         */
        public get sharedNode() {
            return this._sharedNode as IValueTable_1_0_0;
        }

        /**
         * Static accessor for all declared field names (get only)
         */
        static get fieldName() {
            return {
                rows: "rows",
                props: "props",
            };
        }

        get $rows() {
            return new TypedArrayProperty<Row_1_0_0, IValueRow_1_0_0, IValueTable_1_0_0>(
                this._sharedNode,
                "rows",
                this.isAttached(),
            );
        }
        get $props() {
            return new TypedMapProperty<Prop_1_0_0, IValueProp_1_0_0, IValueTable_1_0_0>(
                this._sharedNode,
                "props",
                this.isAttached(),
            );
        }
    }

    /**
     * Alias for hxgn:Table-1.0.0
     *
     * Table Data
     * @public
     */
    export type Table = InstanceType<typeof Table_1_0_0>;

    /**
     * Alias for hxgn:Table-1.0.0
     *
     * Table Data
     * @public
     */
    export type IValueTable = IValueTable_1_0_0;

    /**
     * Alias for Table_1_0_0
     *
     * Table Data
     * @public
     */
    export const Table = Table_1_0_0;
} // end export namespace hxgn {

const wrappedConstructors: wrapConstructorRepositoryType = {
    "hxgn:Prop-1.0.0": hxgn.Prop_1_0_0,
    "hxgn:RefProp-1.0.0": hxgn.RefProp_1_0_0,
    "hxgn:Cell-1.0.0": hxgn.Cell_1_0_0,
    "hxgn:RedCell-1.0.0": hxgn.RedCell_1_0_0,
    "hxgn:AnotherStringProp-1.0.0": hxgn.AnotherStringProp_1_0_0,
    "hxgn:Row-1.0.0": hxgn.Row_1_0_0,
    "hxgn:StringProp-1.0.0": hxgn.StringProp_1_0_0,
    "hxgn:BlueCell-1.0.0": hxgn.BlueCell_1_0_0,
    "hxgn:Table-1.0.0": hxgn.Table_1_0_0,
};
