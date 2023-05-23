/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import { IDocumentService, IDocumentStorageService } from "@fluidframework/driver-definitions";
import { DocumentServiceProxy } from "../../documentServiceProxy";
import { ICompressionStorageConfig, SummaryCompressionProcessor } from "..";
import { DocumentStorageServiceCompressionAdapter as DocumentStorageServiceSummaryBlobCompressionAdapter } from "./summaryblob";

export class DocumentServiceCompressionAdapter extends DocumentServiceProxy {
	constructor(service: IDocumentService, private readonly _config: ICompressionStorageConfig) {
		super(service);
	}

	public static storageServiceConstructor(
		config: ICompressionStorageConfig,
	): new (
		storage: IDocumentStorageService,
		config: ICompressionStorageConfig,
	) => IDocumentStorageService {
		switch (config.processor) {
			case SummaryCompressionProcessor.SummaryBlob: {
				return DocumentStorageServiceSummaryBlobCompressionAdapter;
			}
			default: {
				throw new Error(`Invalid processor type ${config.processor}`);
			}
		}
	}

	public async connectToStorage(): Promise<IDocumentStorageService> {
		const storage = await super.connectToStorage();
		const wrapped = new (DocumentServiceCompressionAdapter.storageServiceConstructor(
			this._config,
		))(storage, this._config);
		await wrapped.getSnapshotTree();
		DocumentServiceCompressionAdapter.storageServiceConstructor(this._config);
		return wrapped;
	}
}
