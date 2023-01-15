/**
 * See the tests for examples of all the features of the MessageBridge
 * This is an example of how it can be used with React (as hooks)
 *
 * It some point there may come a React specific package for this.
 */

//import React, { useCallback, useEffect, useState } from "react"
import { Message } from "../src/MessageBridgeTypes"
import { WebsocketMessageBridgeService as MessageBridgeService } from "../src/WebsocketMessageBridgeService"
// import { SignalRMessageBridgeService } from "../src/SignalRMessageBridgeService"
// import { WebSocketConnectionService } from "../src/WebSocketConnectionService"

// # MessageBridgeService is a SignalRMessageBridgeService!
const bridge = new MessageBridgeService("ws:/localhost:8080")

// Enabled (console) logging
// msgBridge.debugLogger = console.log // custom logger can be set
bridge.debugLogging.messageReceived = true
bridge.debugLogging.sendingMessage = true

bridge.onClose = (reason) => {
  console.log("connection closed", reason)
}

// # You can also use it directly
// const msgBridge = new SignalRMessageBridgeService("ws:/localhost:8080")
// #Or use the ("simple") Websocket version
// const msgBridge = new WebSocketConnectionService("ws:/localhost:8080")

/*await*/ bridge.connect() // await to connect

// # Queries

export interface ITodoItem {
  id: number
  title: string
  done: boolean
}

export interface IGetTodoItemsWithPagination {
  search?: string
  pageNumber?: number
  pageSize?: number
  done?: boolean
}

// async version
export const GetTodoItemsWithPagination = (query: IGetTodoItemsWithPagination) => {
  return bridge.sendQuery<IGetTodoItemsWithPagination, ITodoItem[]>({
    name: "GetTodoItemsWithPagination",
    payload: query,
  })
}

const { response: todoItems } = await GetTodoItemsWithPagination({
  search: "ss",
  pageNumber: 1,
  pageSize: 10,
  done: false,
})

// non async version
export const GetTodoItems = (query: IGetTodoItemsWithPagination) => {
  return bridge.sendQuery<IGetTodoItemsWithPagination, ITodoItem[]>({
    name: "GetTodoItemsWithPagination",
    payload: query,
    onSuccess(items) {
      console.log(items)
    },
  })
}

// # Commands

export interface ICreateTodoItem {
  listId?: number
  title: string
}

export const CreateTodoItem = (command: ICreateTodoItem) => {
  return bridge.sendCommand<ICreateTodoItem, number>({
    name: "CreateTodoItem",
    payload: command,
  })
}

const { response /*: id*/ } = await CreateTodoItem({ title: "ss" })

export const CreateTodoItemDirect = async (command: ICreateTodoItem) => {
  const { response: id } = await bridge.sendCommand<ICreateTodoItem, number>({
    name: "CreateTodoItem",
    payload: command,
  })
  return id
}

const id = await CreateTodoItemDirect({ title: "ss" })

export interface IDeleteTodoItem {
  id: number
}

export const DeleteTodoItem = (id: number) => {
  bridge.sendCommand<IDeleteTodoItem, void>({ name: "DeleteTodoItem", payload: { id } })
}

await DeleteTodoItem(id)

/**
 * ---------- React hook example ----------
 */
function useQuery<TQuery, TResponse>(
  queryName: string,
  query: TQuery,
  refetchOnEvent?: string,
): [TResponse | undefined, (query?: TQuery) => Promise<TResponse | undefined>] {
  //@ts-ignore (no real react module)
  const [_state, setState] = useState<TResponse | undefined>()
  //@ts-ignore (no real react module)
  const [_query, setQuery] = useState<TQuery | undefined>()
  //@ts-ignore (no real react module)
  const fetchQuery = useCallback(
    async (query?: TQuery) => {
      if (query) setQuery(query)
      else query = _query
      if (!query) return
      return bridge.sendQuery<TQuery, TResponse>({
        name: queryName,
        payload: query,
      })
    },
    [queryName, _query],
  )
  //@ts-ignore (no real react module)
  useEffect(() => {
    if (!refetchOnEvent) return
    const unsubscribe = bridge.subscribeEvent<TResponse>({
      name: refetchOnEvent,
      async onEvent() {
        const next = fetchQuery()
        setState(next)
      },
    })
    return () => unsubscribe()
  }, [queryName, query])
  return [_state, fetchQuery]
}

const useGetTodo = (id: number) => useQuery("GetTodo", { id })

// multiple queries can be sent in parallel
const one = useGetTodo(1) // returns an uncalled promise
const two = useGetTodo(2) // returns an uncalled promise
const [oneResult, twoResult] = await Promise.all([one, two])
console.log(oneResult, twoResult)
