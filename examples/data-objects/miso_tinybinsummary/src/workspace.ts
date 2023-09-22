/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { InsecureTokenProvider } from "@fluidframework/test-runtime-utils";
import {
    AzureClient, AzureRemoteConnectionConfig, ITelemetryBaseLogger,
} from "@fluidframework/azure-client";
import { SharedCell } from "@fluidframework/cell";



export async function initializeWorkspace(containerId: string | undefined): Promise<Workspace> {
    const createNew = containerId === undefined;
    const treeClass: any = SharedCell;
    const containerSchema = {
        initialObjects: { tree: treeClass },
    };
    const azureClient = createAzureClient();
    let containerAndServices;
    if (createNew) {
        containerAndServices = await azureClient.createContainer(containerSchema);
        // eslint-disable-next-line no-param-reassign
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await azureClient.getContainer(containerId!, containerSchema);
    }
    const sharedTree = containerAndServices.container.initialObjects.tree as SharedCell;
    const workspacePromise = {
        containerId,
        tree: sharedTree,
    };
    return workspacePromise;
}

export async function copyContainer(containerId: string ): Promise<Workspace> {
    const createNew = containerId === undefined;
    const treeClass: any = SharedCell;
    const containerSchema = {
        initialObjects: { tree: treeClass },
    };
    const azureClient = createAzureClient();
    let containerAndServices;
    if (createNew) {
        containerAndServices = await azureClient.createContainer(containerSchema);
        // eslint-disable-next-line no-param-reassign
        containerId = await containerAndServices.container.attach();
    } else {
        containerAndServices = await azureClient.copyContainer(containerId, containerSchema);
    }
    const sharedTree = containerAndServices.container.initialObjects.tree as SharedCell;
    const workspacePromise = {
        containerId,
        tree: sharedTree,
    };
    return workspacePromise;
}

export interface Workspace {
    containerId: string | undefined;
    tree: SharedCell;
}

/*
function createAzureClient() {
    const myUser: any = {
        id: "miso",
        name: "miso",
    };
    return new AzureClient({
        connection: {
            type: "local",
            tokenProvider: new InsecureTokenProvider("abcd", myUser),
            endpoint: "http://localhost:7070",
        },
        summaryCompression: true,
    });
}
*/

function createAzureClient() {
    return getClient("miso", undefined);
}

export function getClient(
    userId: string,
    logger: ITelemetryBaseLogger | undefined
  ): AzureClient {
    console.log(`ENV.FLUID_MODE is ${process.env.FLUID_MODE}`);
    switch (process.env.FLUID_MODE) {
      case "frs":
        const remoteConnectionConfig: AzureRemoteConnectionConfig = {
          type: "remote",
          tenantId: process.env.SECRET_FLUID_TENANT!,
          tokenProvider: new InsecureTokenProvider(
            process.env.SECRET_FLUID_TOKEN!,
            {
              id: userId,
              name: userId,
            }
          ),
          endpoint: process.env.SECRET_FLUID_RELAY!,
        };
        console.log(`Connecting to ${process.env.SECRET_FLUID_RELAY}`);
        return new AzureClient({
          connection: remoteConnectionConfig,
          logger,
          summaryCompression: true,
        });
      case "router": // guesswork, untested
        const routerConnectionConfig: AzureRemoteConnectionConfig = {
          type: "remote",
          tenantId: "fluid",
          tokenProvider: new InsecureTokenProvider(
            "create-new-tenants-if-going-to-production",
            { id: userId, name: userId }
          ),
          endpoint: "http://localhost:3003",
        };
        console.log(`Connecting to ${routerConnectionConfig.endpoint}`);
        return new AzureClient({
          connection: routerConnectionConfig,
          logger,
        });
      default:
        console.log(`Connecting to http://localhost:7070`);
        return new AzureClient({
          connection: {
            type: "local",
            tokenProvider: new InsecureTokenProvider("", {
              id: userId,
              name: userId,
            }),
            endpoint: "http://localhost:7070",
          },
          logger,
        });
    }
  }
