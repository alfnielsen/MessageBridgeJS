import {
  Message,
  MessageDirection,
  MessageType,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/connection-protocols/ClientSideMessageBridgeService"
import { InMemoryClientSideServer } from "../src/connection-protocols/InMemoryClientSideServer"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  Store,
  TodoItem,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { testServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = testServer

it("test flow: async, non async, cleanup", async () => {
  //@ts-ignore // private/protected method
  const spyInternalSendMessage = jest.spyOn(bridge, "internalSendMessage")
  //@ts-ignore // private/protected method
  const spyHandleIncomingMessage = jest.spyOn(bridge, "handleIncomingMessage")

  await bridge.connect()
  // -------------------- Query --------------------

  expect(bridge.history.length).toBe(0)

  //console.log("step 2: send query")
  const {
    request: queryRequest,
    requestMessage: queryRequestMessage,
    response: queryResponse,
    responseMessage: queryResponseMessage,
  } = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
  })

  // test query response
  expect(queryRequest.search).toBe("todo")
  expect(queryResponse.items.length).toBe(3)
  expect(queryResponse.items[0].id).toBe(1)
  expect(queryResponse.items[0].title).toBe("todo1")
  expect(queryResponse.items[1].id).toBe(2)
  expect(queryResponse.items[1].title).toBe("todo2")
  expect(queryResponse.items[2].id).toBe(3)
  expect(queryResponse.items[2].title).toBe("todo3")
  expect(queryRequestMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(queryRequestMessage.type).toBe(MessageType.Query)
  expect(queryRequestMessage.payload).toMatchObject({ search: "todo" })
  expect(queryRequestMessage.direction).toBe(MessageDirection.ToServer)
  expect(queryResponseMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(queryResponseMessage.type).toBe(MessageType.QueryResponse)
  expect(queryResponseMessage.payload).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })
  expect(queryResponseMessage.direction).toBe(MessageDirection.ToClient)

  //console.log("step 3: send query (with onSuccess)")
  // NON await call (With no onSuccess - to test cleanup)
  bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
  })
  // NON await call (With onSuccess)
  let innerResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse>
    | undefined
  bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "1",
    },
    onSuccess(opt) {
      innerResponse = opt
    },
  })

  // wait 100ms for the non await calls to finish
  await new Promise((resolve) => setTimeout(resolve, 100))
  // test non await call
  if (!innerResponse) throw new Error("innerResponse is undefined")
  expect(innerResponse.request).toBeDefined()
  expect(innerResponse.response).toBeDefined()
  expect(innerResponse.requestMessage).toBeDefined()
  expect(innerResponse.responseMessage).toBeDefined()
  expect(innerResponse.request?.search).toBe("1")
  expect(innerResponse.response?.items.length).toBe(1)
  expect(innerResponse.response?.items[0].id).toBe(1)
  expect(innerResponse.response?.items[0].title).toBe("todo1")
  expect(innerResponse.requestMessage?.name).toBe(RequestType.GetTodoItemQuery)
  expect(innerResponse.requestMessage?.type).toBe(MessageType.Query)
  expect(innerResponse.requestMessage?.payload).toMatchObject({ search: "1" })
  expect(innerResponse.requestMessage?.direction).toBe(MessageDirection.ToServer)
  expect(innerResponse.responseMessage?.name).toBe(RequestType.GetTodoItemQuery)
  expect(innerResponse.responseMessage?.type).toBe(MessageType.QueryResponse)
  expect(innerResponse.responseMessage?.payload).toMatchObject({
    items: [{ id: 1, title: "todo1" }],
  })
  expect(innerResponse.responseMessage?.direction).toBe(MessageDirection.ToClient)

  // test history and cleanup
  const historyLog = bridge.history.map((h) => h.name + "-" + h.type).join(",")
  const expectedHistoryLog = [
    "GetTodoItemQuery-Query",
    "GetTodoItemQuery-QueryResponse",
    "GetTodoItemQuery-Query",
    "GetTodoItemQuery-Query",
    "GetTodoItemQuery-QueryResponse",
    "GetTodoItemQuery-QueryResponse",
  ].join(",")
  expect(historyLog).toBe(expectedHistoryLog)
  expect(bridge.history.length).toBe(6)
  expect(Object.keys(bridge.subscribedTrackIdMap).length).toBe(0)

  // -------------------- Event + Subscription (continues in command!) --------------------

  // subscribe
  let eventCountAll = 0
  let eventHistory: string[] = []
  bridge.subscribeEvent<TodoItem>({
    name: RequestType.TodoItemUpdated,
    onEvent(event, message) {
      if (message.name !== RequestType.TodoItemUpdated) {
        throw new Error("Unexpected response")
      }
      eventCountAll++
      eventHistory.push(event.title)
    },
  })
  let eventCountUnsub = 0
  const unsubEvent = bridge.subscribeEvent({
    name: RequestType.TodoItemUpdated,
    onEvent(event, message) {
      if (message.name !== RequestType.TodoItemUpdated) {
        throw new Error("Unexpected response")
      }
      eventCountUnsub++
    },
  })

  // -------------------- COMMAND --------------------

  //console.log("step 4: send command")
  // Update
  const { request, response, requestMessage, responseMessage } = await bridge.sendCommand<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 changed",
    },
  })

  // test response
  expect(request.id).toBe(2)
  expect(request.title).toBe("todo2 changed")
  expect(response.done).toBe(true)
  expect(requestMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(requestMessage.type).toBe(MessageType.Command)
  expect(requestMessage.payload).toMatchObject({ id: 2, title: "todo2 changed" })
  expect(requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(responseMessage.name).toBe(RequestType.UpdateTodoItemCommand)
  expect(responseMessage.type).toBe(MessageType.CommandResponse)
  expect(responseMessage.payload).toMatchObject({ done: true })
  expect(responseMessage.direction).toBe(MessageDirection.ToClient)

  var trackIdCount = Object.keys(bridge.subscribedTrackIdMap).length

  expect(trackIdCount).toBe(0)

  // Wait for event
  await (() => new Promise((resolve) => setTimeout(resolve, 500)))()

  // Unsubscribe
  unsubEvent()

  // NON await call
  bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 2,
      title: "todo2 changed back",
    },
  })

  // the mock server will respond after 1ms (and we use test NON await call)
  await (() => new Promise((resolve) => setTimeout(resolve, 500)))()

  //console.log("step 5: checks and clean up")
  // check clean up
  var trackIdCount = Object.keys(bridge.subscribedTrackIdMap).length
  expect(trackIdCount).toBe(0)

  expect(bridge.subscribedEventListMap[RequestType.TodoItemUpdated].length).toBe(1)

  // // TEST:
  // let eventCountAll = 0
  // let eventHistory: string[] = []
  // let eventCountUnsub = 0
  // let subbedCountAll = 0
  // let subbedCountUnsub = 0
  // let subbedLog: string[] = []

  expect(eventCountAll).toBe(2)
  expect(eventCountUnsub).toBe(1)
  expect(eventHistory).toEqual(["todo2 changed", "todo2 changed back"])

  // test history
  // Timing! The FakeServer sends Event after 50ms
  // (This could break this history test, if the running test is slow!)
  //expect(bridge.history.length).toBe(8)
  const logHistory = bridge.history.map((h) => h.name + "-" + h.type).join(", ")
  const exceptedLogHistory = [
    "GetTodoItemQuery-Query", // internalSendMessage (1)
    "GetTodoItemQuery-QueryResponse", // handleIncomingMessage (1)
    "GetTodoItemQuery-Query", // internalSendMessage (2)
    "GetTodoItemQuery-Query", // internalSendMessage (3)
    "GetTodoItemQuery-QueryResponse", // handleIncomingMessage (2)
    "GetTodoItemQuery-QueryResponse", // handleIncomingMessage (3)
    "UpdateTodoItemCommand-Command", // internalSendMessage (4)
    "UpdateTodoItemCommand-CommandResponse", // handleIncomingMessage (4)
    // Await update here
    "TodoItemUpdated-Event", // handleIncomingMessage (5)
    "UpdateTodoItemCommand-Command", // internalSendMessage (5)
    "UpdateTodoItemCommand-CommandResponse", // handleIncomingMessage (6)
    "TodoItemUpdated-Event", // handleIncomingMessage (7)
  ].join(", ")

  expect(logHistory).toBe(exceptedLogHistory)

  expect(spyInternalSendMessage).toBeCalledTimes(5)
  // 1 query, 2 commands, 2 events
  expect(spyHandleIncomingMessage).toBeCalledTimes(7)
})
