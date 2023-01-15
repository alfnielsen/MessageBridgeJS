export enum RequestType {
  GetTodoItemQuery = "GetTodoItemQuery",
  UpdateTodoItemCommand = "UpdateTodoItemCommand",
  TodoItemUpdated = "TodoItemUpdated",
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
}
export type GetTodoItemQueryResponse = {
  items: TodoItem[]
}
export type GetTodoItemQuery = {
  search: string
}
