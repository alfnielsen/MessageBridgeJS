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
      this.onClose(event.reason)
    })

    return new Promise<void>((resolve, reject) => {
      // Connection opened
      this.socket?.addEventListener("open", (event) => {
        this.connected = true
        resolve()
      })
    })
  }

  sendNetworkMessage(msg: Message) {
    const msgJson = JSON.stringify(msg)
    this.socket?.send(msgJson)
  }
}
