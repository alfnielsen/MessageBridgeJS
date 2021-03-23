let SignalR = jest.genMockFromModule("@microsoft/signalr")

class HubConnection {
  public on(methodName: string, callback: () => string): Promise<void> {
    this.successCallback = callback
    return Promise.resolve()
  }

  public start(): Promise<void> {
    return Promise.resolve()
  }
  public invoke(): Promise<void> {
    return Promise.resolve()
  }

  public successCallback: () => string = () => "failure"
}

let hubConnection = new HubConnection()

let HubConnectionBuilder = () => ({
  withUrl: (url: string) => ({
    withAutomaticReconnect: () => ({
      build: () => hubConnection,
    }),
  }),
})

//@ts-ignore
SignalR.HubConnectionBuilder = HubConnectionBuilder
//@ts-ignore
SignalR.HubConnection = hubConnection

module.exports = SignalR
