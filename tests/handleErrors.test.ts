import { Message, RequestMaybeNoError, RequestResponse } from "../src/MessageBridgeTypes"
import { ClientSideMessageBridgeService } from "../src/services/ClientSideMessageBridgeService"
import { GetTodoItemQuery, GetTodoItemQueryResponse, RequestType } from "./TestInterfaces"
import { createTestServer } from "./TestServer"
import { RequestErrorResponse } from "../src/services/InMemoryClientSideServer"

// --------------------- error tracking ---------------------
const bridge = new ClientSideMessageBridgeService("ws://localhost:1234")
bridge.server = createTestServer()

test("error handling - tracked version - type do not exists", async () => {
  await bridge.connect()

  //let errorResponse: RequestMaybeNoError<any, any> | undefined
  const { request, response, error, isError } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    RequestErrorResponse
  >({
    name: "NonExistingQuery",
    payload: { search: "1" },
  })

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
})

test("error handling - tracked version - callback - type do not exists", async () => {
  await bridge.connect()

  let errorResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse, RequestErrorResponse>
    | undefined

  await bridge.sendQueryTracked<
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
})

test("error handling - non tracked version - try catch - type do not exists", async () => {
  await bridge.connect()

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
})

test("error handling - non tracked version - callback (avoidThrowOnNonTrackedError:true) - type do not exists", async () => {
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

test("error handling - non tracked version - callback - error ignored (avoidThrowOnNonTrackedError:true) - type do not exists", async () => {
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

test("error handling - tracked version - throw (throwOnTrackedError:true) - type do not exists", async () => {
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

test("error handling - tracked version - throw (throwOnTrackedError:true) - type do not exists", async () => {
  await bridge.connect()

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

  expect(errorResponse).toBeUndefined()
})

test("error handling - tracked version - server error", async () => {
  await bridge.connect()

  let errorResponse:
    | RequestResponse<GetTodoItemQuery, GetTodoItemQueryResponse, RequestErrorResponse>
    | undefined

  const { error } = await bridge.sendQueryTracked<
    GetTodoItemQuery,
    GetTodoItemQueryResponse,
    RequestErrorResponse
  >({
    name: RequestType.GetTodoItemQuery,
    payload: { search: "1", throwError: true },
  })

  expect(error).toBeDefined()
  if (!error) {
    throw new Error("error should be defined")
  }
  expect(error.message.indexOf("ServerError(GetTodoItemQuery)")).toBe(0)
  // We relay on the "InMemoryClientSideServer" response here and it's RequestErrorResponse
  expect(errorResponse).toBeUndefined()
})
