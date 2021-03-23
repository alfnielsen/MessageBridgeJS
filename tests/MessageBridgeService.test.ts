import WS from "jest-websocket-mock"
import { Message } from "../src/Message"
import { MessageBridgeService } from "../src/MessageBridgeService"
import { MessageDirection } from "../src/MessageDirection"
import { MessageType } from "../src/MessageType"

interface TodoItem {
  id: number
  title: string
}

interface UpdateTodoItemResponse {
  items: TodoItem[]
}

interface UpdateTodoItemCommandDto {
  nameLike: string
}

it("should re-call query on event messages from the server", async () => {
  jest.mock("@microsoft/signalr")
  const wsUri = "ws://localhost:1234"
  var mbs = new MessageBridgeService(wsUri)
  // @ts-ignore (internalSendMessage is a private method!)
  const spy = jest.spyOn(mbs, "internalSendMessage")

  await mbs.connect()
  // send (1)
  mbs.subscribeQuery<UpdateTodoItemCommandDto, UpdateTodoItemResponse>({
    name: "UpdateTodoItem",
    query: { nameLike: "test" },
    triggers: ["UpdateTodoItemEvent"],
    update: (msg) => {},
  })

  expect(mbs.history.length).toBe(1)
  // SERVER:
  var serverFromMsg = Message.create<TodoItem[]>({
    name: "UpdateTodoItem",
    type: MessageType.QueryResponse,
    direction: MessageDirection.ToClient,
    payload: [{ id: 1, title: "title1" }],
  })
  mbs.handleIncomingMessage(serverFromMsg)
  // CLIENT
  expect(mbs.history.length).toBe(2)
  // SERVER:
  var serverFromMsg = Message.create<TodoItem[]>({
    name: "UpdateTodoItemEvent",
    type: MessageType.Event,
    direction: MessageDirection.ToClient,
  })
  // send (2)
  mbs.handleIncomingMessage(serverFromMsg)
  // Should trigger re-call to server
  // CLIENT
  expect(mbs.history.length).toBe(4)
  //
  expect(mbs.history[0].name).toBe("UpdateTodoItem")
  expect(mbs.history[0].type).toBe(MessageType.Query)
  expect(mbs.history[0].payload).toMatchObject({ nameLike: "test" })
  expect(mbs.history[0].direction).toBe(MessageDirection.ToServer)
  //
  expect(mbs.history[1].name).toBe("UpdateTodoItem")
  expect(mbs.history[1].type).toBe(MessageType.QueryResponse)
  expect(mbs.history[1].payload).toMatchObject([{ id: 1, title: "title1" }])
  expect(mbs.history[1].direction).toBe(MessageDirection.ToClient)
  //
  expect(mbs.history[2].name).toBe("UpdateTodoItemEvent")
  expect(mbs.history[2].type).toBe(MessageType.Event)
  expect(mbs.history[2].payload).toBeUndefined()
  expect(mbs.history[2].direction).toBe(MessageDirection.ToClient)
  //
  expect(mbs.history[3].name).toBe("UpdateTodoItem")
  expect(mbs.history[3].type).toBe(MessageType.Query)
  expect(mbs.history[3].payload).toMatchObject({ nameLike: "test" })
  expect(mbs.history[3].direction).toBe(MessageDirection.ToServer)
  expect(mbs.history[3].trackId).not.toBe("tract_1")

  expect(spy).toBeCalledTimes(2)
})
