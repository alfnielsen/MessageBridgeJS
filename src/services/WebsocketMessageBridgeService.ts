import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase"
import { Message } from "../MessageBridgeTypes"

export class WebsocketMessageBridgeService extends MessageBridgeServiceBase {
  socket?: WebSocket
  connectedCallback?: () => void

  connect() {
    this.socket = new WebSocket(this.wsUri)
    this.socket.addEventListener("message", (event) => {
      const messageString: string | Message = event.data
      this.onMessage(messageString)
    })
    this.socket.addEventListener("close", (event) => {
      this.onClose(event.reason, event)
    })
    this.socket.addEventListener("error", (event) => {
      this.onError(event, event)
    })

    return new Promise<void>((resolve, reject) => {
      // Connection opened
      this.socket?.addEventListener("open", (event) => {
        this.onConnect()
        resolve()
      })
    })
  }
  close(): void {
    this.socket?.close()
    this.onClose()
  }

  sendNetworkMessage(msg: Message) {
    const msgJson = JSON.stringify(msg)
    this.socket?.send(msgJson)
  }
}
