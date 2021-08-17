import { Message } from "./Message";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";

export class WebsocketMessageBridgeService extends MessageBridgeServiceBase {
  wsUri: string = "";
  socket?: WebSocket;
  connectedCallback?: () => void;

  connect() {
    this.socket = new WebSocket(this.wsUri);
    this.socket.addEventListener("message", (event) => {
      const messageString: string | Message = event.data;
      this.onMessage(messageString);
    });

    return new Promise<void>((resolve, reject) => {
      // Connection opened
      this.socket?.addEventListener("open", (event) => {
        resolve();
      });
    });
  }

  sendNetworkMessage(msg: Message) {
    const msgJson = JSON.stringify(msg);
    this.socket?.send(msgJson);
  }
}
