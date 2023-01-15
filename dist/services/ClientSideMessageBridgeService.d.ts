import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase";
import { Message } from "../MessageBridgeTypes";
export type MessageBridgeClientServer = {
    onMessage: (msg: Message) => void;
    connect: (sendMessage: (msg: Message) => void) => void;
};
export declare class ClientSideMessageBridgeService extends MessageBridgeServiceBase {
    server?: MessageBridgeClientServer;
    setServer(server: MessageBridgeClientServer): void;
    connect(): Promise<void>;
    close(): void;
    sendNetworkMessage(msg: Message): void;
}
//# sourceMappingURL=ClientSideMessageBridgeService.d.ts.map