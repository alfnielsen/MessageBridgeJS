import { Message, RequestMaybeNoError, RequestResponse } from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { createTestServer } from "./TestServer"
import { RequestErrorResponse } from "../src/services/InMemoryClientSideServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
beforeEach(() => {
  bridge.server = createTestServer() // reset server
})

// -------------------- debug (logger) --------------------

// logger?: (...data: any[]) => void // set custom logger (default: console?.log)
// logMessageReceived?: boolean
// logSendingMessage?: boolean
// logMessageReceivedFilter?: undefined | string | RegExp // restrict logging to messages matching this filter
// logSendingMessageFilter?: undefined | string | RegExp // restrict logging to messages matching this filter

test("bridge options: set logger", async () => {
  // reset server
  await bridge.connect()
  const logList: Message[] = []
  const logListType: string[] = []
  bridge.setOptions({
    logger: (...logData) => {
      //console.log(...logData)
      logListType.push(logData[0] as string)
      logList.push(logData[1] as Message)
    },
    logMessageReceived: true,
    logSendingMessage: true,
    logMessageReceivedFormat: (message) => ["Received", message],
    logSendingMessageFormat: (message) => ["Sending", message],
    // logMessageReceivedFilter: "todo1",
    // logSendingMessageFilter: "todo1",
  })

  // send (1) + receive (1) => 2
  await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "1",
    },
  })

  // send (1) + receive (1) => 2
  await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "2",
    },
  })

  // send (1) + receive (1) + event (1) => 3
  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 changed",
    },
  })

  // send (1) + receive (1) + event (1) => 3
  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 changed",
    },
  })

  // await server events (the server is set to delay 10ms)
  await new Promise((resolve) => setTimeout(resolve, 200))

  expect(logList.length).toBe(10)

  expect(logListType[0]).toBe("Sending")
  expect(logListType[1]).toBe("Received")
  expect(logListType[2]).toBe("Sending")
  expect(logListType[3]).toBe("Received")
  expect(logListType[4]).toBe("Sending")
  // from her event can be received in any order

  expect(logListType.filter((x) => x === "Received").length).toBe(6)
  expect(logListType.filter((x) => x === "Sending").length).toBe(4)

  // CLEANUP
  bridge.setOptions({
    logger: undefined,
  })
})
