import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions";
import { MessageBridgeServiceBase } from "./MessageBridgeServiceBase";

export class SignalRMessageBridgeService extends MessageBridgeServiceBase {
  connection?: signalR.HubConnection;

  connect(options: IHttpConnectionOptions = {}): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.wsUri, options)
      .withAutomaticReconnect()
      .build();
    this.connection.on("ReceiveMessage", (messageString: string | Message) => {
      this.onMessage(messageString);
    });
    return this.connection.start();
  }

  sendNetworkMessage(msg: Message) {
    const msgJson = JSON.stringify(msg);
    this.connection?.invoke("SendMessage", msgJson).catch((err) => {
      this.onError(err as Error);
      return console.error(err.toString());
    });
  }
}
