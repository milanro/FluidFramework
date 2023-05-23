/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/dot-notation */
import { strict as assert } from "assert";
import {
	IClient,
	ICreateBlobResponse,
	ISnapshotTree,
	ISummaryBlob,
	ISummaryHandle,
	ISummaryTree,
	IVersion,
	SummaryType,
} from "@fluidframework/protocol-definitions";
import {
	FetchSource,
	IDocumentDeltaConnection,
	IDocumentDeltaStorageService,
	IDocumentService,
	IDocumentServiceFactory,
	IDocumentServicePolicies,
	IDocumentStorageService,
	IDocumentStorageServicePolicies,
	IResolvedUrl,
	ISummaryContext,
} from "@fluidframework/driver-definitions";
import { ITelemetryBaseLogger } from "@fluidframework/common-definitions";
import {
	applyStorageCompression,
	DefaultCompressionStorageConfig,
	ICompressionStorageConfig,
	SummaryCompressionAlgorithm,
	SummaryCompressionProcessor,
} from "../adapters";
import { DocumentStorageServiceProxy } from "../documentStorageServiceProxy";
import { snapshotTree, summaryTemplate } from "./summaryCompressionData";
/**
 * This function clones the imported summary and returns a new summary with the same content.
 */
function cloneSummary(): ISummaryTree {
	return JSON.parse(JSON.stringify(summaryTemplate)) as ISummaryTree;
}

/**
 * This function generates the summary with the given content size. At first it clones the summary
 * template, then it generates the content with the given size by loop, which will
 * use repeated sequence from 0 to 10 to generate the content until the content size is achieved.
 * The content is stored in the header of the summary.
 * @param contentSize - The size of the content to be generated.
 */
function generateSummaryWithContent(contentSize: number) {
	const summary = cloneSummary();
	const header = (
		(
			((summary.tree[".channels"] as ISummaryTree).tree.rootDOId as ISummaryTree).tree[
				".channels"
			] as ISummaryTree
		).tree["7a99532d-94ec-43ac-8a53-d9f978ad4ae9"] as ISummaryTree
	).tree.header;
	let contentString = "";
	while (contentString.length < contentSize) {
		if (contentString.length + 10 > contentSize) {
			contentString += "0123456789".substring(0, contentSize - contentString.length);
			break;
		} else {
			contentString += "0123456789";
		}
	}
	header["content"] = `{"value": ${contentString}}`;
	return summary;
}

const misotestid: string = "misotest-id";

const abcContent = "ABC";
class InternalTestStorage implements IDocumentStorageService {
	constructor(private readonly config: ICompressionStorageConfig) {}
	private _uploadedSummary: ISummaryTree | undefined;

	repositoryUrl: string = "";
	policies?: IDocumentStorageServicePolicies | undefined;

	async getSnapshotTree(
		version?: IVersion | undefined,
		scenarioName?: string | undefined,
	): Promise<ISnapshotTree | null> {
		return JSON.parse(JSON.stringify(snapshotTree));
	}
	async getVersions(
		versionId: string | null,
		count: number,
		scenarioName?: string | undefined,
		fetchSource?: FetchSource | undefined,
	): Promise<IVersion[]> {
		throw new Error("Method not implemented.");
	}
	async createBlob(file: ArrayBufferLike): Promise<ICreateBlobResponse> {
		throw new Error("Method not implemented.");
	}
	async readBlob(id: string): Promise<ArrayBufferLike> {
		return id === misotestid
			? new TextEncoder().encode(abcContent)
			: getHeaderContent(this._uploadedSummary!);
	}
	async uploadSummaryWithContext(
		summary: ISummaryTree,
		context: ISummaryContext,
	): Promise<string> {
		this._uploadedSummary = summary;
		return "test";
	}
	async downloadSummary(handle: ISummaryHandle): Promise<ISummaryTree> {
		return this._uploadedSummary!;
	}
	disposed?: boolean | undefined;
	dispose?(error?: Error | undefined): void {
		throw new Error("Method not implemented.");
	}

	public get uploadedSummary(): ISummaryTree | undefined {
		return this._uploadedSummary;
	}

	public thisIsReallyOriginalStorage: string = "yes";
}

function isOriginalStorage(storage: IDocumentStorageService): boolean {
	return (storage as InternalTestStorage).thisIsReallyOriginalStorage === "yes";
}

class InternalTestDocumentService implements IDocumentService {
	constructor(private readonly config: ICompressionStorageConfig) {}
	resolvedUrl: IResolvedUrl = { type: "web", data: "" };
	policies?: IDocumentServicePolicies | undefined;
	storage: IDocumentStorageService = new InternalTestStorage(this.config);
	async connectToStorage(): Promise<IDocumentStorageService> {
		return this.storage;
	}
	async connectToDeltaStorage(): Promise<IDocumentDeltaStorageService> {
		throw new Error("Method not implemented.");
	}
	async connectToDeltaStream(client: IClient): Promise<IDocumentDeltaConnection> {
		throw new Error("Method not implemented.");
	}
	dispose(error?: any): void {
		throw new Error("Method not implemented.");
	}
}

class InternalTestDocumentServiceFactory implements IDocumentServiceFactory {
	private readonly documentService: IDocumentService;
	constructor(private readonly config: ICompressionStorageConfig | boolean = true) {
		const myConfig =
			typeof this.config === "boolean" ? DefaultCompressionStorageConfig : this.config;
		this.documentService = new InternalTestDocumentService(myConfig);
	}

	async createDocumentService(
		resolvedUrl: IResolvedUrl,
		logger?: ITelemetryBaseLogger | undefined,
		clientIsSummarizer?: boolean | undefined,
	): Promise<IDocumentService> {
		return this.documentService;
	}
	async createContainer(
		createNewSummary: ISummaryTree | undefined,
		createNewResolvedUrl: IResolvedUrl,
		logger?: ITelemetryBaseLogger | undefined,
		clientIsSummarizer?: boolean | undefined,
	): Promise<IDocumentService> {
		return this.documentService;
	}
}

async function buildCompressionStorage(
	config?: ICompressionStorageConfig | boolean,
): Promise<IDocumentStorageService> {
	{
		const factory: IDocumentServiceFactory = applyStorageCompression(
			new InternalTestDocumentServiceFactory(config),
			config,
		);
		const documentService = await factory.createContainer(undefined, { type: "web", data: "" });
		const storage = await documentService.connectToStorage();
		return storage;
	}
}

describe("Summary Compression Test", () => {
	it("Verify Proper Summary Generation", async () => {
		const summary = generateSummaryWithContent(1000000);
		const content = getHeaderContent(summary);
		assert(
			content.length === 1000000 + 11,
			`The content size is ${content.length} and should be 1000011`,
		);
	});
	it("Verify Config True", async () => {
		const storage = await buildCompressionStorage(true);
		checkCompressionConfig(storage, 500, SummaryCompressionAlgorithm.LZ4);
	});
	it("Verify Config False", async () => {
		const storage = await buildCompressionStorage(false);
		const config = (storage as any)._config;
		assert(config === undefined, "The storage has compression");
		assert(isOriginalStorage(storage), "The storage is not the original storage");
	});
	it("Verify Config Empty", async () => {
		const storage = await buildCompressionStorage();
		const config = (storage as any)._config;
		assert(config === undefined, "The storage has compression");
		assert(isOriginalStorage(storage), "The storage is not the original storage");
	});
	it("Verify Config Object (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.None,
			minSizeToCompress: 763,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		const storage = await buildCompressionStorage(config);
		checkCompressionConfig(storage, 763, SummaryCompressionAlgorithm.None);
		assert(
			(storage as any).adapterType === SummaryCompressionProcessor.SummaryBlob,
			"Not summary-blob storage",
		);
	});

	it("Verify Compressed Markup at Summary (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.LZ4,
			minSizeToCompress: 500,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		const storage = (await buildCompressionStorage(config)) as DocumentStorageServiceProxy;
		const summary = generateSummaryWithContent(1000);
		await storage.uploadSummaryWithContext(summary, {
			referenceSequenceNumber: 0,
			proposalHandle: "test",
			ackHandle: "test",
		});
		const uploadedSummary = ((storage as any).service as InternalTestStorage).uploadedSummary;
		assert(
			uploadedSummary?.tree[".summary-blob-compression.enabled"] !== undefined,
			"The summary-blob markup is not added",
		);
	});

	it("Verify Blob Enc/Dec Symetry (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.LZ4,
			minSizeToCompress: 500,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		await checkEncDec(config);
	});

	it("Verify Upload / Download Summary (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.LZ4,
			minSizeToCompress: 500,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		await checkUploadDownloadSummary(config);
	});

	it("Verify .protocol (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.LZ4,
			minSizeToCompress: 500,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		const storage = (await buildCompressionStorage(config)) as DocumentStorageServiceProxy;
		const summary = generateSummaryWithContent(1000);
		await storage.uploadSummaryWithContext(summary, {
			referenceSequenceNumber: 0,
			proposalHandle: "test",
			ackHandle: "test",
		});
		const content = new TextDecoder().decode(await storage.readBlob(misotestid));
		assert(content === abcContent, "The .profile underlying blob content is not correct");
	});
	it("Verify .protocol at Download Summary (summary-blob markup)", async () => {
		const config: ICompressionStorageConfig = {
			algorithm: SummaryCompressionAlgorithm.LZ4,
			minSizeToCompress: 500,
			processor: SummaryCompressionProcessor.SummaryBlob,
		};
		const downloadedSummary = await checkUploadDownloadSummary(config);
		const content = downloadedSummary.tree[".protocol"]["tree"]["misotest"]["content"];
		assert(content === abcContent, "The .profile underlying blob content is not correct");
	});
});
async function checkUploadDownloadSummary(
	config: ICompressionStorageConfig,
): Promise<ISummaryTree> {
	const storage = (await buildCompressionStorage(config)) as DocumentStorageServiceProxy;
	const summary = generateSummaryWithContent(1000);
	const originBlobContent = getHeaderContent(summary);
	await storage.uploadSummaryWithContext(summary, {
		referenceSequenceNumber: 0,
		proposalHandle: "test",
		ackHandle: "test",
	});
	await storage.getSnapshotTree({ id: "test", treeId: "test" }, "test");
	const summaryHandle: ISummaryHandle = {
		type: SummaryType.Handle,
		handleType: SummaryType.Tree,
		handle: "test",
	};
	const downloadedSummary: ISummaryTree = await storage.downloadSummary(summaryHandle);
	const downloadedBlobContentBin = getHeaderContent(downloadedSummary);
	// const blobStr = new TextDecoder().decode(blob);
	const downloadedBlobContent = new TextDecoder().decode(downloadedBlobContentBin);
	assert(
		originBlobContent === downloadedBlobContent,
		`The origin and the downloaded blob are not the same
		\norigin     : ${originBlobContent} 
		\ndownloaded : ${downloadedBlobContent}`,
	);
	return downloadedSummary;
}

async function checkEncDec(config: ICompressionStorageConfig) {
	const storage = (await buildCompressionStorage(config)) as DocumentStorageServiceProxy;
	const summary = generateSummaryWithContent(1000);
	const originHeaderHolder: ISummaryTree = getHeaderHolder(summary);
	const originBlob = (originHeaderHolder.tree.header as ISummaryBlob).content;
	await storage.uploadSummaryWithContext(summary, {
		referenceSequenceNumber: 0,
		proposalHandle: "test",
		ackHandle: "test",
	});
	await storage.getSnapshotTree({ id: "test", treeId: "test" }, "test");
	const blob: ArrayBufferLike = await storage.readBlob(
		"ee84b67e86708c9dd7fc79ff8f3380b78f000b79",
	);
	const blobStr = new TextDecoder().decode(blob);
	assert(
		blobStr === originBlob,
		`The origin and the downloaded blob are not the same \n\n\n${blobStr}\n\n${originBlob}`,
	);
}

function checkCompressionConfig(
	storage: IDocumentStorageService,
	expectedMinSizeToCompress: number,
	expectedAlgorithm: SummaryCompressionAlgorithm,
) {
	const config = (storage as any)._config;
	assert(config !== undefined, "The storage has no compression");
	assert(
		(config.minSizeToCompress === expectedMinSizeToCompress,
		`Unexpected minSizeToCompress config ${config.minSizeToCompress}`),
	);
	assert(
		(config.algorithmm === expectedAlgorithm,
		`Unexpected minSizeToCompress config ${config.algorithmm}`),
	);
}

function getHeaderContent(summary: ISummaryTree) {
	return getHeader(summary)["content"];
}

function getCompressedHeaderContent(summary: ISummaryTree) {
	return getCompressedHeader(summary)["content"];
}

function getHeader(summary: ISummaryTree) {
	return getHeaderHolder(summary).tree.header;
}

function getCompressedHeader(summary: ISummaryTree) {
	return getHeaderHolder(summary).tree.compressed_2_header;
}

function getHeaderHolder(summary: ISummaryTree) {
	return (
		((summary.tree[".channels"] as ISummaryTree).tree.rootDOId as ISummaryTree).tree[
			".channels"
		] as ISummaryTree
	).tree["7a99532d-94ec-43ac-8a53-d9f978ad4ae9"] as ISummaryTree;
}
