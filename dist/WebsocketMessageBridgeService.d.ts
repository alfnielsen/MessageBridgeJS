import { Message } from "./Message";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";
export declare class WebsocketMessageBridgeService extends MessageBridgeServiceBase {
    socket?: WebSocket;
    connectedCallback?: () => void;
    connect(): Promise<void>;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=WebsocketMessageBridgeService.d.ts.map