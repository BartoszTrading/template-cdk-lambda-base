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