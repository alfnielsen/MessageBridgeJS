import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions";
import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase";
import { Message } from "../MessageBridgeTypes";
export declare class SignalRMessageBridgeService extends MessageBridgeServiceBase {
    connection?: signalR.HubConnection;
    connect(options?: IHttpConnectionOptions): Promise<void>;
    close(): void;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=SignalRMessageBridgeService.d.ts.map