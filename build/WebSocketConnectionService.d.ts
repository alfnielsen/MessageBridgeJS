import { Message } from "./Message";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";
export declare class WebsocketMessageBridgeService extends MessageBridgeServiceBase {
    wsUri: string;
    socket?: WebSocket;
    connectedCallback?: () => void;
    connect(): Promise<void>;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=WebSocketConnectionService.d.ts.map