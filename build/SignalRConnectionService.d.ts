import * as signalR from "@microsoft/signalr";
import { Message } from "./Message";
import { ConnectionService } from "./ConnectionService";
import { IHttpConnectionOptions } from "@microsoft/signalr/src/IHttpConnectionOptions";
export declare class SignalRConnectionService extends ConnectionService {
    wsUri: string;
    connection?: signalR.HubConnection;
    connect(options?: IHttpConnectionOptions): Promise<void>;
    sendMessage(msg: Message): void;
}
//# sourceMappingURL=SignalRConnectionService.d.ts.map