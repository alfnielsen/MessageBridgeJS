import { Message } from "./Message";
import { MessageBridgeService } from "./MessageBridgeService";

export abstract class ConnectionService {
  constructor(public messageBridgeService: MessageBridgeService) {}

  abstract connect(options?: unknown): Promise<void>;

  abstract sendMessage(msg: Message): void;

  onMessage(messageString: string | Message) {
    let messageDto: Message;
    try {
      messageDto =
        typeof messageString === "string"
          ? (JSON.parse(messageString) as Message)
          : messageString;
    } catch (e) {
      this.messageBridgeService.onError(e as Error);
      console.log("Incorrect message received: " + messageString);
      return;
    }
    try {
      const msg = Message.fromDto(messageDto);
      this.messageBridgeService.handleIncomingMessage(msg);
    } catch (e) {
      console.log("Error in response handle for message: " + e);
    }
  }
}
