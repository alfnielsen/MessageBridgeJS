import {
  Message,
  MessageDirection,
  MessageType,
  RequestMaybeNoError,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { createTestServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

// --------------------- events ---------------------
test("sendEvent", async () => {
  await bridge.connect()

  const eventMessageList = [] as Message[]

  bridge.subscribeEvent({
    name: RequestType.Pong,
    onEvent: (payload, eventMessage) => {
      eventMessageList.push(eventMessage)
    },
  })

  await bridge.sendEvent({
    name: RequestType.Ping,
    payload: {},
  })

  // await responses from server (The server is set the fake a delay of 10ms)
  await new Promise((resolve) => setTimeout(resolve, 100))

  expect(eventMessageList.length).toBe(1)
  expect(eventMessageList[0].type).toBe(MessageType.Event)
})

test("subscribeEvent", async () => {
  await bridge.connect()

  const eventPayloadList = [] as any[]
  const eventMessageList = [] as Message[]

  bridge.subscribeEvent({
    name: RequestType.TodoItemUpdated,
    onEvent: (payload, eventMessage) => {
      eventPayloadList.push(payload)
      eventMessageList.push(eventMessage)
    },
  })

  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1",
    },
  })

  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 changed",
    },
  })

  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 restored",
    },
  })

  // await responses from server (The server is set the fake a delay of 10ms)
  await new Promise((resolve) => setTimeout(resolve, 100))

  expect(eventPayloadList).toMatchObject([
    { id: 1, title: "todo1" },
    { id: 2, title: "todo2 changed" },
    { id: 2, title: "todo2 restored" },
  ])

  expect(eventPayloadList.length).toBe(3)
  expect(eventMessageList.length).toBe(3)
  expect(eventMessageList[0].type).toBe(MessageType.Event)
})
