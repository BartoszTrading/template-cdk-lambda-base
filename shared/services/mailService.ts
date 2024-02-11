import nodemailer from 'nodemailer';
import { CreateConnectionData, MailInterface } from '../interfaceses/mailInterface';
import { logInfo } from '../utils';
export default class MailService {
    private static instance: MailService;
    private transporter: nodemailer.Transporter;

    //INTSTANCE CREATE FOR MAIL
    static getInstance() {
        if (!MailService.instance) {
            MailService.instance = new MailService();
        }
        return MailService.instance;
    }
    //CREATE CONNECTION FOR LOCAL
    async createLocalConnection() {
        let account = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
        });
    }
    //CREATE CONNECTION FOR LIVE
    async createConnection(data: CreateConnectionData) {
        this.transporter = nodemailer.createTransport({
            host: data.host,
            port: data.port,
            secure: data.secure,
            auth: {
                user: data.auth.user,
                pass: data.auth.pass,
            },
        } as nodemailer.TransportOptions); // Add the 'as nodemailer.TransportOptions' type assertion
    }
    //SEND MAIL
    async sendMail(
        requestId: string | number | string[],
        options: MailInterface
    ) {
        return await this.transporter
            .sendMail({ 
                from: `${process.env.SMTP_SENDER || options.from}`,
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                subject: options.subject,
                text: options.text,
                html: options.html,
            })
            .then((info) => {
                logInfo(`${requestId} - Mail sent successfully!!`);
                logInfo(`${requestId} - [MailResponse]=${info.response} [MessageID]=${info.messageId}`);
                if (process.env.NODE_ENV === 'local') {
                    logInfo(`${requestId} - Nodemailer ethereal URL: ${nodemailer.getTestMessageUrl(
                        info
                    )}`);
                }
                return info;
            });
    }
    //VERIFY CONNECTION
    async verifyConnection() {
        return this.transporter.verify();
    }
    //CREATE TRANSPOTER
    getTransporter() {
        return this.transporter;
    }
}