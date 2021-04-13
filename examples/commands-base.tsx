//import React, { useEffect, useState } from "react"
import { Message } from "../src/Message"
import { MessageBridgeService } from "../src/MessageBridgeService"

const msgBridge = new MessageBridgeService("ws:/localhost:8080")
/*await*/ msgBridge.connect()

/**
 * React hook
 *
 * (Note: add provider)
 *
 * @param name
 * @param query
 * @param triggers
 */

function useQuery<TQuery, TResponse>(
  name: string,
  query: TQuery,
  triggers: string[]
): TResponse | undefined {
  //@ts-ignore
  const [state, setState] = useState<TResponse | undefined>()
  //@ts-ignore
  useEffect(() => {
    const unsubscribe = msgBridge.subscribeQuery<TQuery, TResponse>({
      name,
      query,
      triggers,
      onUpdate: (item, msg) => {
        setState(item)
      },
    })
    return () => unsubscribe()
  }, [name, query, triggers])
  return state
}

export interface ICreateTodoItem {
  listId: number
  title: string
}
export const CreateTodoItem = (command: ICreateTodoItem) => {
  return new Promise((resolve, reject) => {
    msgBridge.sendCommand<ICreateTodoItem, number>({
      name: "CreateTodoItem",
      payload: command,
      onSuccess: (id: number, msg) => {
        resolve(id)
      },
      onError: (error, msg) => {
        reject(error)
      },
    })
  })
}

CreateTodoItem({ listId: 1, title: "ss" }).then((id) => {})

export interface IDeleteTodoItem {
  id: number
}
export const DeleteTodoItem = (command: IDeleteTodoItem) => {
  msgBridge.sendCommand({ name: "DeleteTodoItem", payload: command })
}

export interface IUpdateTodoItem {
  id: number
  title: string
  done: boolean
}

export interface IGetTodoItemsWithPagination {
  listId: number
  pageNumber: number
  pageSize: number
  done: boolean
}

interface ITodoItem {
  title: string
  id: number
  done: boolean
}
interface IGetTodoItem {
  id: number
}

const useGetTodo = (id: number, triggers: string[]) =>
  useQuery<IGetTodoItem, ITodoItem>("GetTodo", { id }, triggers)

export const functionalComponent = () => {
  var todoItem = useGetTodo(1, ["UpdateTodoItem"])
  var todoItem = useGetTodo(1, ["UpdateTodoItem"])
  //@ts-ignore
  return <div>{todoItem?.id}</div>
}
