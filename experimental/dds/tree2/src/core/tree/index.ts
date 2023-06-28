/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

export {
	Anchor,
	AnchorLocator,
	AnchorSet,
	AnchorSlot,
	AnchorNode,
	anchorSlot,
	AnchorEvents,
	AnchorSetRootEvents,
} from "./anchorSet";
export {
	ITreeCursor,
	CursorLocationType,
	castCursorToSynchronous,
	mapCursorField,
	mapCursorFields,
	forEachNode,
	forEachField,
	ITreeCursorSynchronous,
	PathRootPrefix,
	inCursorField,
	inCursorNode,
	CursorMarker,
	isCursor,
} from "./cursor";
export { ProtoNodes } from "./delta";
export {
	GlobalFieldKeySymbol,
	keyFromSymbol,
	symbolFromKey,
	symbolIsFieldKey,
} from "./globalFieldKeySymbol";
export { getMapTreeField, MapTree } from "./mapTree";
export {
	clonePath,
	topDownPath,
	getDepth,
	UpPath,
	FieldUpPath,
	compareUpPaths,
	compareFieldUpPaths,
	UpPathDefault,
} from "./pathTree";
export {
	FieldMapObject,
	FieldScope,
	GenericFieldsNode,
	genericTreeDeleteIfEmpty,
	genericTreeKeys,
	GenericTreeNode,
	getGenericTreeField,
	isGlobalFieldKey,
	JsonableTree,
	scopeFromKey,
	setGenericTreeField,
} from "./treeTextFormat";
export {
	EncodedFieldMapObject,
	EncodedGenericFieldsNode,
	EncodedGenericTreeNode,
	EncodedJsonableTree,
	EncodedNodeData,
} from "./persistedTreeTextFormat";
export {
	EmptyKey,
	FieldKey,
	TreeType,
	ChildLocation,
	DetachedField,
	ChildCollection,
	RootField,
	Value,
	TreeValue,
	detachedFieldAsKey,
	keyAsDetachedField,
	rootFieldKey,
	NodeData,
	rootFieldKeySymbol,
	rootField,
	isLocalKey,
} from "./types";
export { DeltaVisitor, visitDelta } from "./visitDelta";
export { PathVisitor } from "./visitPath";

// Split this up into separate import and export for compatibility with API-Extractor.
import * as Delta from "./delta";
export { Delta };

export { SparseNode, getDescendant } from "./sparseTree";

export { isSkipMark, emptyDelta } from "./deltaUtil";
