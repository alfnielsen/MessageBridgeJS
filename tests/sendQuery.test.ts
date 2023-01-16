import {
  Message,
  MessageDirection,
  MessageType,
  RequestMaybeNoError,
  RequestResponse,
} from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import { GetTodoItemQuery, GetTodoItemQueryResponse, RequestType } from "./TestInterfaces"
import { createTestServer } from "./TestServer"

const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
beforeEach(() => {
  bridge.server = createTestServer() // reset server
})

// --------------------- tracked versions ---------------------

test("await sendQueryTracked", async () => {
  await bridge.connect()
  const { request, response, requestMessage, responseMessage } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
      name: RequestType.GetTodoItemQuery,
      payload: {
        search: "todo",
      },
    })

  // test query response
  expect(request.search).toBe("todo")
  expect(response.items.length).toBe(3)
  expect(response.items[0].id).toBe(1)
  expect(response.items[0].title).toBe("todo1")
  expect(response.items[1].id).toBe(2)
  expect(response.items[1].title).toBe("todo2")
  expect(response.items[2].id).toBe(3)
  expect(response.items[2].title).toBe("todo3")
  expect(requestMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(requestMessage.type).toBe(MessageType.Query)
  expect(requestMessage.payload).toMatchObject({ search: "todo" })
  expect(requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(responseMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(responseMessage.type).toBe(MessageType.QueryResponse)
  expect(responseMessage.payload).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })
  expect(responseMessage.direction).toBe(MessageDirection.ToClient)
})

test("callback (await) sendQueryTracked", async () => {
  await bridge.connect()
  let result: RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse> | undefined
  await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
    onSuccess(opt) {
      result = opt
    },
  })

  // test query response
  expect(result).toBeDefined()
  if (!result) {
    throw new Error("request is undefined")
  }
  expect(result.request.search).toBe("todo")
  expect(result.response.items.length).toBe(3)
  expect(result.response.items[0].id).toBe(1)
  expect(result.response.items[0].title).toBe("todo1")
  expect(result.response.items[1].id).toBe(2)
  expect(result.response.items[1].title).toBe("todo2")
  expect(result.response.items[2].id).toBe(3)
  expect(result.response.items[2].title).toBe("todo3")
  expect(result.requestMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.requestMessage.type).toBe(MessageType.Query)
  expect(result.requestMessage.payload).toMatchObject({ search: "todo" })
  expect(result.requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(result.responseMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.responseMessage.type).toBe(MessageType.QueryResponse)
  expect(result.responseMessage.payload).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })
  expect(result.responseMessage.direction).toBe(MessageDirection.ToClient)
})

test("callback (no await) sendQueryTracked", async () => {
  await bridge.connect()
  let result: RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse> | undefined
  bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
    onSuccess(opt) {
      result = opt
    },
  })
  // wait for response
  await new Promise((resolve) => setTimeout(resolve, 100))

  // test query response
  expect(result).toBeDefined()
  if (!result) {
    throw new Error("request is undefined")
  }
  expect(result.request.search).toBe("todo")
  expect(result.response.items.length).toBe(3)
  expect(result.response.items[0].id).toBe(1)
  expect(result.response.items[0].title).toBe("todo1")
  expect(result.response.items[1].id).toBe(2)
  expect(result.response.items[1].title).toBe("todo2")
  expect(result.response.items[2].id).toBe(3)
  expect(result.response.items[2].title).toBe("todo3")
  expect(result.requestMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.requestMessage.type).toBe(MessageType.Query)
  expect(result.requestMessage.payload).toMatchObject({ search: "todo" })
  expect(result.requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(result.responseMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.responseMessage.type).toBe(MessageType.QueryResponse)
  expect(result.responseMessage.payload).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })
  expect(result.responseMessage.direction).toBe(MessageDirection.ToClient)
})

// --------------------- non tacked ("normal") ---------------------

test("await sendQuery", async () => {
  await bridge.connect()
  const response = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
  })

  // test query response
  expect(response.items.length).toBe(3)
  expect(response.items[0].id).toBe(1)
  expect(response.items[0].title).toBe("todo1")
  expect(response.items[1].id).toBe(2)
  expect(response.items[1].title).toBe("todo2")
  expect(response.items[2].id).toBe(3)
  expect(response.items[2].title).toBe("todo3")
})

test("await sendQuery spread response", async () => {
  await bridge.connect()
  const { items } = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
  })

  // test query response
  expect(items.length).toBe(3)
  expect(items[0].id).toBe(1)
  expect(items[0].title).toBe("todo1")
  expect(items[1].id).toBe(2)
  expect(items[1].title).toBe("todo2")
  expect(items[2].id).toBe(3)
  expect(items[2].title).toBe("todo3")
})

test("callback (await) sendQuery", async () => {
  await bridge.connect()
  let response: GetTodoItemQueryResponse | undefined
  await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
    onSuccess({ response: _response }) {
      response = _response
    },
  })

  // test query response
  expect(response).toBeDefined()
  if (!response) {
    throw new Error("request is undefined")
  }
  expect(response.items.length).toBe(3)
  expect(response.items[0].id).toBe(1)
  expect(response.items[0].title).toBe("todo1")
  expect(response.items[1].id).toBe(2)
  expect(response.items[1].title).toBe("todo2")
  expect(response.items[2].id).toBe(3)
  expect(response.items[2].title).toBe("todo3")
})

test("callback (no await) sendQuery", async () => {
  await bridge.connect()
  let response: GetTodoItemQueryResponse | undefined
  bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
    onSuccess({ response: _response }) {
      response = _response
    },
  })
  // wait for response
  await new Promise((resolve) => setTimeout(resolve, 100))

  // test query response
  expect(response).toBeDefined()
  if (!response) {
    throw new Error("request is undefined")
  }
  expect(response.items.length).toBe(3)
  expect(response.items[0].id).toBe(1)
  expect(response.items[0].title).toBe("todo1")
  expect(response.items[1].id).toBe(2)
  expect(response.items[1].title).toBe("todo2")
  expect(response.items[2].id).toBe(3)
  expect(response.items[2].title).toBe("todo3")
})

test("callback await sendQuery (Get track from onSuccess)", async () => {
  await bridge.connect()
  let response: GetTodoItemQueryResponse | undefined
  let result: RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse> | undefined
  await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: {
      search: "todo",
    },
    onSuccess(_result) {
      response = _result.response
      result = _result
    },
  })

  // test query response
  expect(result).toBeDefined()
  expect(response).toBeDefined()
  if (!result) {
    throw new Error("request is undefined")
  }
  if (!response) {
    throw new Error("response is undefined")
  }
  expect(result.response).toBe(response)
  expect(result.request.search).toBe("todo")
  expect(result.response.items.length).toBe(3)
  expect(result.response.items[0].id).toBe(1)
  expect(result.response.items[0].title).toBe("todo1")
  expect(result.response.items[1].id).toBe(2)
  expect(result.response.items[1].title).toBe("todo2")
  expect(result.response.items[2].id).toBe(3)
  expect(result.response.items[2].title).toBe("todo3")
  expect(result.requestMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.requestMessage.type).toBe(MessageType.Query)
  expect(result.requestMessage.payload).toMatchObject({ search: "todo" })
  expect(result.requestMessage.direction).toBe(MessageDirection.ToServer)
  expect(result.responseMessage.name).toBe(RequestType.GetTodoItemQuery)
  expect(result.responseMessage.type).toBe(MessageType.QueryResponse)
  expect(result.responseMessage.payload).toMatchObject({
    items: [
      { id: 1, title: "todo1" },
      { id: 2, title: "todo2" },
      { id: 3, title: "todo3" },
    ],
  })
  expect(result.responseMessage.direction).toBe(MessageDirection.ToClient)
})
