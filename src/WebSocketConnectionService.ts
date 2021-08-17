import { Message } from "./Message";
import { ConnectionService } from "./ConnectionService";

export class MessageBridgeServiceMock extends ConnectionService {
  wsUri: string = "";
  socket?: WebSocket;
  connectedCallback?: () => void;

  connect(url: string) {
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

  sendMessage(msg: Message) {
    const msgJson = JSON.stringify(msg);
    this.socket?.send(msgJson);
  }
}
