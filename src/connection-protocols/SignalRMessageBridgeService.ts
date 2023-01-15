import { HubConnectionBuilder } from "@microsoft/signalr"
import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions"
import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase"
import { Message } from "../MessageBridgeTypes"

export class SignalRMessageBridgeService extends MessageBridgeServiceBase {
  connection?: signalR.HubConnection
  connect(options: IHttpConnectionOptions = {}): Promise<void> {
    this.connection = new HubConnectionBuilder()
      .withUrl(this.wsUri, options)
      .withAutomaticReconnect()
      .build()
    if (!this.connection) {
      throw new Error("Failed to create SignalR connection")
    }
    this.connection.on("ReceiveMessage", (messageString: string | Message) => {
      this.onMessage(messageString)
    })
    this.connection.onclose((error) => {
      this.onClose(error)
    })
    return this.connection
      .start()
      .then(() => {
        this.connected = true
      })
      .catch((err: Error) => {
        this.onError(err)
      })
  }

  sendNetworkMessage(msg: Message) {
    const msgJson = JSON.stringify(msg)
    this.connection?.invoke("SendMessage", msgJson).catch((err) => {
      this.onError(err as Error)
      return console.error(err.toString())
    })
  }
}
