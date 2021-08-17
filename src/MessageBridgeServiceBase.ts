import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import {
  IMessageServiceQuerySubscription,
  MessageDirection,
  MessageType,
  SubscribeResponse,
  SubscribeResponseWithCatch,
} from "./MessageBridgeInterfaces";

export abstract class MessageBridgeServiceBase {
  connected = false;
  connection?: signalR.HubConnection;

  constructor(public wsUri: string) {}

  abstract connect(options?: unknown): Promise<void>;
  abstract sendNetworkMessage(msg: Message): void;

  protected onMessage(messageString: string | Message) {
    let messageDto: Message;
    try {
      messageDto =
        typeof messageString === "string"
          ? (JSON.parse(messageString) as Message)
          : messageString;
    } catch (e) {
      this.onError(e as Error);
      console.log("Incorrect message received: " + messageString);
      return;
    }
    try {
      const msg = Message.fromDto(messageDto);
      this.handleIncomingMessage(msg);
    } catch (e) {
      console.log("Error in response handle for message: " + e);
    }
  }

  protected subscriptionTrackIdList: {
    [trackId: string]: SubscribeResponseWithCatch<any>;
  } = {};

  protected subscriptionEventList: {
    [eventName: string]: SubscribeResponse<any>[];
  } = {};

  protected subscriptionQuery: IMessageServiceQuerySubscription<any, any>[] =
    [];

  history: Message[] = [];
  bridgeErrors: (Error | string)[] = [];

  sendMessage<TPayload = any, TResponse = any, TSchema = any>(
    msg: Message<TPayload, TResponse, TSchema>,
    onSuccess?: SubscribeResponse<TResponse>,
    onError?: SubscribeResponse<any>
  ) {
    msg.direction = MessageDirection.ToServer;
    if (onSuccess || onError) {
      this.subscriptionTrackIdList[msg.trackId] = { onSuccess, onError };
    }
    this.internalSendMessage(msg);
  }

  protected internalSendMessage(msg: Message) {
    this.history.push(msg);
    this.sendNetworkMessage(msg);
  }

  subscribeEvent<TResponse = any>({
    name,
    onEvent,
  }: {
    name: string;
    onEvent: SubscribeResponse<TResponse>;
  }) {
    if (!this.subscriptionEventList[name])
      this.subscriptionEventList[name] = [];
    this.subscriptionEventList[name].push(onEvent);
    return () => {
      const index = this.subscriptionEventList[name].findIndex(
        (x) => x === onEvent
      );
      this.subscriptionEventList[name].splice(index, 1);
    };
  }

  createCommandMessage<TPayload = any, TResponse = any, TSchema = any>(
    name: string,
    payload: TPayload,
    direction = MessageDirection.ToServer
  ) {
    return Message.create<TPayload, TResponse, TSchema>({
      name,
      type: MessageType.Command,
      payload,
      direction,
    });
  }

  createQueryMessage<TPayload = any>(
    name: string,
    payload: TPayload,
    direction = MessageDirection.ToServer
  ) {
    return Message.create({
      name,
      type: MessageType.Query,
      payload,
      direction,
    });
  }

  createEventMessage<TPayload = any>(
    name: string,
    payload: TPayload,
    direction = MessageDirection.ToServer
  ) {
    return Message.create({
      name,
      type: MessageType.Event,
      payload,
      direction,
    });
  }

  sendCommand<TPayload = any, TResponse = any, TSchema = any>({
    name,
    payload,
    onSuccess,
    onError,
  }: {
    name: string;
    payload: TPayload;
    onSuccess?: SubscribeResponse<TResponse>;
    onError?: SubscribeResponse<any>;
  }) {
    const msg = this.createCommandMessage(name, payload);
    this.sendMessage<TPayload, TResponse, TSchema>(msg, onSuccess, onError);
    return msg;
  }

  sendQuery<TPayload = any, TResponse = any, TSchema = any>({
    name,
    payload,
    onSuccess,
    onError,
  }: {
    name: string;
    payload: TPayload;
    onSuccess?: SubscribeResponse<TResponse>;
    onError?: SubscribeResponse<any>;
  }) {
    const msg = this.createQueryMessage(name, payload);
    this.sendMessage<TPayload, TResponse, TSchema>(msg, onSuccess, onError);
    return msg;
  }

  sendEvent<TPayload = any, TResponse = any, TSchema = any>({
    name,
    payload,
  }: {
    name: string;
    payload: TPayload;
  }) {
    const msg = this.createEventMessage(name, payload);
    this.sendMessage<TPayload, TResponse, TSchema>(msg);
    return msg;
  }

  subscribeQuery<TPayload = any, TResponse = any>(
    opt: IMessageServiceQuerySubscription<TPayload, TResponse>
  ) {
    //call right away
    this.sendQuery({
      name: opt.name,
      payload: opt.query,
      onSuccess: opt.onUpdate,
      onError: opt.onError,
    });
    //then subscribe
    this.subscriptionQuery.push(opt);

    return /*unsubscribe*/ () => {
      const index = this.subscriptionQuery.findIndex((x) => x === opt);
      if (index > 0) {
        this.subscriptionQuery.splice(index, 1);
      }
    };
  }

  // can be overwritten by consumer!
  onError(err: Error) {
    this.bridgeErrors.push(err);
  }

  handleIncomingMessage(msg: Message) {
    this.history.push(msg);
    if (this.subscriptionTrackIdList[msg.trackId]) {
      if (msg.type === MessageType.Error) {
        this.subscriptionTrackIdList[msg.trackId].onError?.(msg.payload, msg);
      } else {
        this.subscriptionTrackIdList[msg.trackId].onSuccess?.(msg.payload, msg);
      }
      delete this.subscriptionTrackIdList[msg.trackId];
    }
    if (msg.type === MessageType.Event) {
      this.receiveEventMessage(msg);
    }
  }

  protected receiveEventMessage(eventMsg: Message) {
    if (this.subscriptionEventList[eventMsg.name]) {
      this.subscriptionEventList[eventMsg.name].forEach((callback) =>
        callback(eventMsg.payload, eventMsg)
      );
    }
    this.subscriptionQuery
      .filter((x) => x.triggers?.some((x) => x === eventMsg.name) ?? false)
      .forEach((x) => {
        const msg = this.createQueryMessage(x.name, x.query);
        this.sendMessage(msg, x.onUpdate, x.onError);
      });
  }
}
