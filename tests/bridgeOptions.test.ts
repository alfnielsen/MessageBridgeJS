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

// --------------------- avoidThrowOnNonTrackedError ---------------------

test("bridge options: avoidThrowOnNonTrackedError:true - callback", async () => {
  await bridge.connect()
  bridge.setOptions({
    avoidThrowOnNonTrackedError: true,
  })

  let errorResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse, RequestErrorResponse>
    | undefined

  await bridge.sendQuery<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    RequestErrorResponse
  >({
    name: "NonExistingQuery",
    payload: { search: "1" },
    onError(_error) {
      errorResponse = _error
    },
  })

  expect(errorResponse).toBeDefined()
  if (!errorResponse) {
    throw new Error("errorResponse should be defined")
  }
  const { error, isError, request, response } = errorResponse
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  // We relay on the "InMemoryClientSideServer" response here and it's RequestErrorResponse
  //message: `Query ${requestMessage.name} not found (Register it with addQuery)`,
  expect(/not found/i.test(error.message)).toBe(true)
  expect(request).toMatchObject({ search: "1" })
  expect(response).toBeUndefined()

  // CLEANUP
  bridge.setOptions({
    avoidThrowOnNonTrackedError: undefined,
  })
})

test("bridge options: avoidThrowOnNonTrackedError:true - callback - should not throw", async () => {
  await bridge.connect()
  bridge.setOptions({
    avoidThrowOnNonTrackedError: true,
  })

  let errorResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse, RequestErrorResponse>
    | undefined

  try {
    await bridge.sendQuery<
      GetTodoItemQuery,
      GetTodoItemQueryResponse,
      RequestErrorResponse
    >({
      name: "NonExistingQuery",
      payload: { search: "1" },
    })
  } catch (e) {
    // @ts-ignore (e is unknown)
    errorResponse = e
  }

  expect(errorResponse).toBeUndefined()
  // CLEANUP
  bridge.setOptions({
    avoidThrowOnNonTrackedError: undefined,
  })
})

// --------------------- throwOnTrackedError ---------------------

test("bridge options: throwOnTrackedError:true - try/catch", async () => {
  await bridge.connect()
  bridge.setOptions({
    throwOnTrackedError: true,
  })

  let errorResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse, RequestErrorResponse>
    | undefined

  try {
    await bridge.sendQueryTracked<
      GetTodoItemQuery,
      GetTodoItemQueryResponse,
      RequestErrorResponse
    >({
      name: "NonExistingQuery",
      payload: { search: "1" },
    })
  } catch (e) {
    // @ts-ignore (e is unknown)
    errorResponse = e
  }

  expect(errorResponse).toBeDefined()
  if (!errorResponse) {
    throw new Error("errorResponse should be defined")
  }
  const { error, isError, request, response } = errorResponse
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  // We relay on the "InMemoryClientSideServer" response here and it's RequestErrorResponse
  //message: `Query ${requestMessage.name} not found (Register it with addQuery)`,
  expect(/not found/i.test(error.message)).toBe(true)
  expect(request).toMatchObject({ search: "1" })
  expect(response).toBeUndefined()

  // CLEANUP
  bridge.setOptions({
    throwOnTrackedError: undefined,
  })
})

// --------------------- timeout ---------------------

test("bridge options: timeout:1000", async () => {
  jest.setTimeout(10000)
  await bridge.connect()
  bridge.setOptions({
    timeout: 1000,
  })

  const { error: shouldBeUndefined, isError: shouldNotBeError } =
    await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse, string>({
      name: RequestType.GetTodoItemQuery,
      payload: { search: "1", sleep: 100 },
    })
  const { error, isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    string
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 5000 },
  })
  expect(shouldNotBeError).toBe(false)
  expect(shouldBeUndefined).toBeUndefined()
  expect(isError).toBe(true)
  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  expect(/timeout/i.test(error)).toBe(true)

  // CLEANUP
  bridge.setOptions({
    timeout: undefined,
  })
})

// --------------------- onError ---------------------

test("bridge options: onError", async () => {
  jest.setTimeout(10000)
  await bridge.connect()

  let errorResponseList: RequestResponse<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    RequestErrorResponse | string
  >[] = []

  bridge.setOptions({
    onError(error) {
      // @ts-ignore (error is unknown)
      errorResponseList.push(error)
    },
  })

  // no error
  await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    timeout: 100,
  })

  // timeout
  await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 1000 },
    timeout: 100,
  })

  // unknown query name
  await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: "NonExistingQuery",
    payload: { search: "1" },
  })

  // server query throw
  await bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", throwError: true },
  })

  // server command throw
  await bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "title",
      throwError: true,
    },
  })

  // incorrect payload
  await bridge.sendCommandTracked<UpdateTodoItemCommand, UpdateTodoItemCommandResponse>({
    name: RequestType.UpdateTodoItemCommand,
    //@ts-ignore
    payload: 42,
  })

  expect(errorResponseList.length).toBe(4)
  const [err1, err2, err3, err4] = errorResponseList
  expect(err1.isError).toBe(true)
  expect(err2.isError).toBe(true)
  expect(err3.isError).toBe(true)
  expect(err4.isError).toBe(true)
  expect(err1.error).toBeDefined()
  expect(err2.error).toBeDefined()
  expect(err3.error).toBeDefined()
  expect(err4.error).toBeDefined()
  if (!err1.error || !err2.error || !err3.error || !err4) {
    throw new Error("error should be defined")
  }

  // is string err1.error
  expect(typeof err1.error).toBe("string")
  if (typeof err1.error !== "string") {
    throw new Error("err1.error should be a string")
  }
  expect(/timeout/i.test(err1.error)).toBe(true)

  expect(!typeof err2.error).toBe(false)
  if (typeof err2.error === "string") {
    throw new Error("err2.error should be not a string")
  }
  expect(/not found/i.test(err2.error.message)).toBe(true)
  expect(!typeof err3.error).toBe(false)
  if (typeof err3.error === "string") {
    throw new Error("err3.error should be not a string")
  }
  expect(err3.error.message.indexOf("ServerError(GetTodoItemQuery)")).toBe(0)
  expect(!typeof err4.error).toBe(false)
  if (typeof err4.error === "string") {
    throw new Error("err4.error should be not a string")
  }
  expect(err4.error?.message.indexOf("ServerError(UpdateTodoItemCommand)")).toBe(0)

  // CLEANUP
  bridge.setOptions({
    onError: undefined,
  })
})

test("bridge options: onError (parallel)", async () => {
  jest.setTimeout(10000)
  await bridge.connect()

  let errorResponseList: RequestResponse<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    RequestErrorResponse | string
  >[] = []

  bridge.setOptions({
    onError(error) {
      // @ts-ignore (error is unknown)
      errorResponseList.push(error)
    },
  })

  // no error
  let promise1 = bridge.sendQueryTracked<GetTodoItemQuery, GetTodoItemQueryResponse>({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1" },
    timeout: 100,
  })

  // timeout
  let promise2 = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", sleep: 1000 },
    timeout: 100,
  })

  // unknown query name
  let promise3 = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse
  >({
    name: "NonExistingQuery",
    payload: { search: "1" },
  })

  // server query throw
  let promise4 = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", throwError: true },
  })

  // server command throw
  let promise5 = await bridge.sendCommandTracked<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    payload: {
      id: 1,
      title: "title",
      throwError: true,
    },
  })

  // incorrect payload
  let promise6 = bridge.sendCommandTracked<
    UpdateTodoItemCommand,
    UpdateTodoItemCommandResponse
  >({
    name: RequestType.UpdateTodoItemCommand,
    //@ts-ignore
    payload: 42,
  })

  await Promise.all([promise1, promise2, promise3, promise4, promise5, promise6])

  expect(errorResponseList.length).toBe(4)
  const [err1, err2, err3, err4] = errorResponseList
  expect(err1.isError).toBe(true)
  expect(err2.isError).toBe(true)
  expect(err3.isError).toBe(true)
  expect(err4.isError).toBe(true)
  expect(err1.error).toBeDefined()
  expect(err2.error).toBeDefined()
  expect(err3.error).toBeDefined()
  expect(err4.error).toBeDefined()
  if (!err1.error || !err2.error || !err3.error || !err4) {
    throw new Error("error should be defined")
  }

  // is string err1.error
  expect(typeof err1.error).toBe("string")
  if (typeof err1.error !== "string") {
    throw new Error("err1.error should be a string")
  }
  expect(/timeout/i.test(err1.error)).toBe(true)

  expect(!typeof err2.error).toBe(false)
  if (typeof err2.error === "string") {
    throw new Error("err2.error should be not a string")
  }
  expect(/not found/i.test(err2.error.message)).toBe(true)
  expect(!typeof err3.error).toBe(false)
  if (typeof err3.error === "string") {
    throw new Error("err3.error should be not a string")
  }
  expect(err3.error.message.indexOf("ServerError(GetTodoItemQuery)")).toBe(0)
  expect(!typeof err4.error).toBe(false)
  if (typeof err4.error === "string") {
    throw new Error("err4.error should be not a string")
  }
  expect(err4.error?.message.indexOf("ServerError(UpdateTodoItemCommand)")).toBe(0)

  // CLEANUP
  bridge.setOptions({
    onError: undefined,
  })
})
