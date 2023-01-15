import { createMessage } from "../MessageBridgeHelper"
import { MessageBridgeServiceBase } from "../MessageBridgeServiceBase"
import { Message, MessageDirection, MessageType } from "../MessageBridgeTypes"

export type MessageBridgeClientServer = {
  onMessage: (msg: Message) => void
  connect: (sendMessage: (msg: Message) => void) => void
}

export class ClientSideMessageBridgeService extends MessageBridgeServiceBase {
  server?: MessageBridgeClientServer
  connect() {
    this.server?.connect((msg) => {
      this.onMessage(msg)
    })
    this.connected = true
    return Promise.resolve()
  }
  sendNetworkMessage(msg: Message) {
    setTimeout(() => {
      this.server?.onMessage(msg)
    }, 10)
  }
}
