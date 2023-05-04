/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { assert } from "@fluidframework/common-utils";
import { IDocumentServiceFactory } from "@fluidframework/driver-definitions";
import {
	SummaryCompressionAlgorithm,
	DocumentServiceFactoryCompressionAdapter,
	ICompressionStorageConfig,
} from "./compression";

/**
 * This method optionally applies compression to the given document service factory. The compression
 * must be enabled by setting the config to true or by passing a compression config object.
 * @param documentServiceFactory - The document service factory to apply compression to.
 * @param config - The compression configuration.
 * @returns - The document service factory possibly with compression applied.
 */
export function applyStorageCompression(
	documentServiceFactory: IDocumentServiceFactory,
	config?: ICompressionStorageConfig | boolean,
): IDocumentServiceFactory {
	if (config === undefined || config === false) {
		return documentServiceFactory;
	} else if (config === true) {
		return applyStorageCompressionInternal(documentServiceFactory);
	} else {
		assert(isCompressionConfig(config), "Invalid compression config");
		return applyStorageCompressionInternal(documentServiceFactory, config);
	}
}

/**
 * This method applies compression to the given document service factory.
 * @param documentServiceFactory - The document service factory to apply compression to.
 * @param config - The compression configuration.
 * @returns - The document service factory with compression applied.
 */
function applyStorageCompressionInternal(
	documentServiceFactory: IDocumentServiceFactory,
	config: ICompressionStorageConfig = {
		algorithm: SummaryCompressionAlgorithm.LZ4,
		minSizeToCompress: 500,
	},
): IDocumentServiceFactory {
	if (config.algorithm === undefined) {
		return documentServiceFactory;
	}
	return new DocumentServiceFactoryCompressionAdapter(documentServiceFactory, config);
}

/**
 * This method checks whether given objects contains
 * a properties expected for the interface ICompressionStorageConfig.
 */
export function isCompressionConfig(config: any): config is ICompressionStorageConfig {
	return (
		config !== undefined &&
		(config.algorithm !== undefined || config.minSizeToCompress !== undefined)
	);
}
