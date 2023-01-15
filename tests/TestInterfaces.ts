export enum RequestType {
  GetTodoItemQuery = "GetTodoItemQuery",
  UpdateTodoItemCommand = "UpdateTodoItemCommand",
  TodoItemUpdated = "TodoItemUpdated",
  Ping = "Ping",
  Pong = "Pong",
}

export type Store = {
  todos: TodoItem[]
}

export type TodoItem = {
  id: number
  title: string
}
export type UpdateTodoItemCommandResponse = {
  done: boolean
}
export type UpdateTodoItemCommand = {
  id: number
  title: string
  throwError?: boolean
  sleep?: number
}
export type GetTodoItemQueryResponse = {
  items: TodoItem[]
}

export type GetTodoItemQuery = {
  search: string
  throwError?: boolean
  sleep?: number
}
