import { createMessage } from "../MessageBridgeHelper"
import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase"
import { Message, MessageDirection, MessageType } from "../MessageBridgeTypes"

export type MessageBridgeClientServer = {
  onMessage: (msg: Message) => void
  connect: (sendMessage: (msg: Message) => void) => void
}

export class ClientSideMessageBridgeService extends MessageBridgeServiceBase {
  server?: MessageBridgeClientServer
  setServer(server: MessageBridgeClientServer) {
    this.server = server
  }
  connect() {
    if (!this.server) {
      throw new Error("No server set")
    }
    this.server?.connect((msg) => {
      this.onMessage(msg)
      this.onConnect()
    })
    return Promise.resolve()
  }
  close() {
    this.onClose()
  }
  sendNetworkMessage(msg: Message) {
    setTimeout(() => {
      this.server?.onMessage(msg)
    }, 10)
  }
}
