/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IDocumentDeltaStorageService } from "@microsoft/fluid-driver-definitions";
import { ISequencedDocumentMessage } from "@microsoft/fluid-protocol-definitions";

/**
 * Mock Document Delta Storage Service for testing
 */
export class MockDocumentDeltaStorageService implements IDocumentDeltaStorageService {
    constructor(private readonly messages: ISequencedDocumentMessage[]) {
        this.messages = messages.sort((a, b) => b.sequenceNumber - a.sequenceNumber);
    }

    public async get(from?: number, to?: number): Promise<ISequencedDocumentMessage[]> {
        const ret: ISequencedDocumentMessage[] = [];
        let index: number = -1;

        // find first
        if (from) {
            // eslint-disable-next-line no-empty
            while (this.messages[++index].sequenceNumber <= from) { }
        }

        // start reading
        while (++index < this.messages.length && (!to || this.messages[++index].sequenceNumber < to)) {
            ret.push(this.messages[index]);
        }

        return ret;
    }
}
