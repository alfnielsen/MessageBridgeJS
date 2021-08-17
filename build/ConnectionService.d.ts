import { Message } from "./Message";
import { MessageBridgeService } from "./MessageBridgeService";
export declare abstract class ConnectionService {
    messageBridgeService: MessageBridgeService;
    constructor(messageBridgeService: MessageBridgeService);
    abstract connect(options?: unknown): Promise<void>;
    abstract sendMessage(msg: Message): void;
    onMessage(messageString: string | Message): void;
}
//# sourceMappingURL=ConnectionService.d.ts.map