import { Message } from "./Message";
import { ConnectionService } from "./ConnectionService";
export declare class MessageBridgeServiceMock extends ConnectionService {
    wsUri: string;
    socket?: WebSocket;
    connectedCallback?: () => void;
    connect(url: string): Promise<void>;
    sendMessage(msg: Message): void;
}
//# sourceMappingURL=WebSocketConnectionService.d.ts.map