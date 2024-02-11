export interface MailInterface {
    from?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html: string;
}

export interface CreateConnectionData {
    host: string;
    port: string;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

export interface Notification {
    buyerid: string;
    type: string;
    vin?: string;
}

export interface SQSMessage {
    subject: string;
    message: string;
    id: string;
    buyerid: string;
}