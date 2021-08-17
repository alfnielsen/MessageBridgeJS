import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";
export declare class SignalRMessageBridgeService extends MessageBridgeServiceBase {
    connection?: signalR.HubConnection;
    connect(options?: IHttpConnectionOptions): Promise<void>;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=SignalRMessageBridgeService.d.ts.map