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

// --------------------- error tracking ---------------------
const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
beforeEach(() => {
  bridge.server = createTestServer() // reset server
})

test("request options: timeout:1000", async () => {
  jest.setTimeout(10000)
  await bridge.connect()

  const { error: shouldBeUndefined, isError: shouldNotBeError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sleep: 500 },
      timeout: 1000,
    })
  const { error, isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 500 },
    timeout: 200,
  })
  expect(shouldNotBeError).toBe(false)
  expect(shouldBeUndefined).toBeUndefined()
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  expect(/timeout/i.test(error)).toBe(true)
})

test("request options: override bridge settings, timeout:1000", async () => {
  jest.setTimeout(10000)
  await bridge.connect()
  bridge.setOptions({
    timeout: 10,
  })

  const { isError: shouldBeError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 500 },
  })

  const { isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 500 },
    timeout: 1000,
  })

  expect(shouldBeError).toBe(true)
  expect(isError).toBe(false)

  bridge.setOptions({
    timeout: undefined,
  })
})

test("request options: timeout:1000", async () => {
  jest.setTimeout(10000)
  await bridge.connect()

  const { error: shouldBeUndefined, isError: shouldNotBeError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sleep: 500 },
      timeout: 1000,
    })
  const { error, isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 500 },
    timeout: 200,
  })
  expect(shouldNotBeError).toBe(false)
  expect(shouldBeUndefined).toBeUndefined()
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  expect(/timeout/i.test(error)).toBe(true)
})

test("request options: cancel (callback check)", async () => {
  await bridge.connect()

  // control
  const todo1 = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
  })
  expect(todo1.items[0]).toMatchObject({ id: 1, title: "todo1" })
  await bridge.sendCommand<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "todo1 -updated",
    },
  })

  const todo1Updated = await bridge.sendQuery<GetTodoItemQuery, GetTodoItemQueryResponse>(
    {
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1" },
    },
  )
  expect(todo1Updated.items[0]).toMatchObject({ id: 1, title: "todo1 -updated" })

  // control cancel flag
  let called = false
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    onSuccess() {
      called = true
    },
  })
  req.cancel()
  await req.send() // should not send
  expect(called).toBe(false)
})

test("request options: cancel - call internal check", async () => {
  await bridge.connect()
  // control cancel flag
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
  })
  req.cancel()
  //@ts-ignore - private method
  const spySendMessagePromiseHandler = jest.spyOn(bridge, "sendMessagePromiseHandler")
  await req.send() // should not send
  expect(spySendMessagePromiseHandler).toBeCalledTimes(0)
})

test("request options: cancel - non-tracked - sendCancelled", async () => {
  jest.setTimeout(10000)
  //@ts-ignore - private method
  const spySendMessagePromiseHandler = jest.spyOn(bridge, "sendMessagePromiseHandler")
  await bridge.connect()
  // control cancel flag
  let called = false
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    sendCancelled: true,
    onSuccess() {
      called = true
    },
  })
  req.cancel()
  expect(req.requestMessage.cancelled).toBe(true)
  await req.send() // should send (resolveCancelled=true)
  expect(spySendMessagePromiseHandler).toBeCalledTimes(1)
})

test("request options: cancel - resolveCancelledForNonTracked:false", async () => {
  jest.setTimeout(10000)
  await bridge.connect()
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    resolveCancelledForNonTracked: false,
    sendCancelled: true,
  })
  req.cancel()
  const value = await req.send()
  expect(req.requestMessage.cancelled).toBe(true)
  expect(value).toBeUndefined()

  // will get the response from the server, but ignore it
})
test("request options: cancel - resolveCancelledForNonTracked:true", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    resolveCancelledForNonTracked: true,
    sendCancelled: true,
  })
  req.cancel()
  const value = await req.send()
  expect(req.requestMessage.cancelled).toBe(true)
  expect(value).toMatchObject({
    items: [
      {
        id: 1,
        title: "todo1",
      },
    ],
  })
  // will get the response from the server, but ignore it
})

test("request options: cancel - callOnSuccessWhenRequestIsCancelled:false", async () => {
  jest.setTimeout(10000)
  await bridge.connect()
  // control cancel flag
  let received = false
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    callOnSuccessWhenRequestIsCancelled: false,
    sendCancelled: true,
    onSuccess() {
      received = true
    },
  })
  req.cancel()
  expect(req.requestMessage.cancelled).toBe(true)
  await req.send()
  expect(received).toBe(false)

  // will get the response from the server, but ignore it
})
test("request options: cancel - callOnSuccessWhenRequestIsCancelled:true", async () => {
  jest.setTimeout(10000)
  await bridge.connect()
  // control cancel flag
  let received = false
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    callOnSuccessWhenRequestIsCancelled: true,
    sendCancelled: true,
    onSuccess() {
      received = true
    },
  })
  req.cancel()
  await req.send()
  expect(req.requestMessage.cancelled).toBe(true)
  expect(received).toBe(true)

  // will get the response from the server, but ignore it
})

test("request options: cancel - allowResponseValueWhenCancelled:false", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  // control cancel flag
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    allowResponseValueWhenCancelled: false,
    sendCancelled: true,
  })
  req.cancel()
  expect(req.requestMessage.cancelled).toBe(true)
  const { request, response, cancelled, isError } = await req.sendTracked()
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeUndefined()
  // will get the response from the server, but ignore it
})

test("request options: cancel - allowResponseValueWhenCancelled:true", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  // control cancel flag
  const req = bridge.createQuery<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    allowResponseValueWhenCancelled: true,
    sendCancelled: true,
  })
  req.cancel()
  expect(req.requestMessage.cancelled).toBe(true)
  const { request, response, cancelled, isError } = await req.sendTracked()
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeDefined()
  // will get the response from the server, but ignore it
})

test("request options: cancel - from server", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  // control cancel flag
  const { response, requestMessage, responseMessage, cancelled, isError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sendCancel: true },
    })
  expect(requestMessage.cancelled).not.toBe(true)
  expect(responseMessage.cancelled).toBe(true)
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeUndefined()
  // will get the response from the server, but ignore it
})

test("request options: cancel - from server (allowResponseOnCancelled: false)", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  // control cancel flag
  const { response, requestMessage, responseMessage, cancelled, isError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sendCancel: true },
      // allowResponseOnCancelled: false, // default
    })
  expect(requestMessage.cancelled).not.toBe(true)
  expect(responseMessage.cancelled).toBe(true)
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeUndefined()
  // will get the response from the server, but ignore it
})

test("request options: cancel - from server (allowResponseValueWhenCancelled: true)", async () => {
  jest.setTimeout(10000)

  await bridge.connect()
  // control cancel flag
  const { response, requestMessage, responseMessage, cancelled, isError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sendCancel: true },
      allowResponseValueWhenCancelled: true,
    })
  expect(requestMessage.cancelled).not.toBe(true)
  expect(responseMessage.cancelled).toBe(true)
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeDefined()
  // will get the response from the server, but ignore it
})

test("request options: cancel - (override bridge options allowResponseValueWhenCancelled: false)", async () => {
  jest.setTimeout(10000)

  bridge.setOptions({
    allowResponseValueWhenCancelled: true,
  })
  await bridge.connect()
  // control cancel flag
  const { response, requestMessage, responseMessage, cancelled, isError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sendCancel: true },
      allowResponseValueWhenCancelled: false, // default (ovveride)
    })
  expect(requestMessage.cancelled).not.toBe(true)
  expect(responseMessage.cancelled).toBe(true)
  expect(cancelled).toBe(true)
  expect(isError).toBe(false)
  expect(response).toBeUndefined()
  // will get the response from the server, but ignore it
})
