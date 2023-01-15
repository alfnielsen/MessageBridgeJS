import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase";
import { Message } from "../MessageBridgeTypes";
export declare class WebsocketMessageBridgeService extends MessageBridgeServiceBase {
    socket?: WebSocket;
    connectedCallback?: () => void;
    connect(): Promise<void>;
    close(): void;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=WebsocketMessageBridgeService.d.ts.map