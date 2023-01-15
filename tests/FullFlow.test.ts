import { RequestResponse } from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import {
  GetTodoItemQuery,
  GetTodoItemQueryResponse,
  RequestType,
  TodoItem,
  UpdateTodoItemCommand,
  UpdateTodoItemCommandResponse,
} from "./TestInterfaces"
import { createTestServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

it("test flow: async, non async, cleanup", async () => {
  //@ts-ignore // private/protected method
  const spyInternalSendMessage = jest.spyOn(bridge, "internalSendMessage")
  //@ts-ignore // private/protected method
  const spyHandleIncomingMessage = jest.spyOn(bridge, "handleIncomingMessage")

  await bridge.connect()
  // -------------------- Query --------------------

  expect(bridge.history.length).toBe(0)

  //console.log("step 2: send query")
  const { response: response1 } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse
  >({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
  })
  // test query response
  expect(response1).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })

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
  bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
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
  expect(innerResponse.responseMessage?.payload).toMatchObject({
    items: [{ id: 1, title: "todo1" }],
  })

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
  const { request, response, requestMessage, responseMessage } =
    await bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>(
      {
        name: RequestType.UpdateTodoItemCommand,
        payload: {
          id: 2,
          title: "todo2 changed",
        },
      },
    )

  // test response
  expect(requestMessage.payload).toMatchObject({ id: 2, title: "todo2 changed" })
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
