// src/logger.ts
import * as vscode from 'vscode'
import {OutputChannel} from 'vscode'
import * as winston from "winston"
import {Writable} from "node:stream"


class VSCodeStream extends Writable {
    channel: OutputChannel

    constructor(channel: OutputChannel) {
        super()
        this.channel = channel
    }

    _write(chunk: any, encoding: string, callback: Function) {
        this.channel.append(chunk.toString())
        callback()
    }
}
const channel = vscode.window.createOutputChannel('Hex Casting Build')
const vscodeStream = new VSCodeStream(channel)

export let logger: winston.Logger = winston.createLogger({
    transports: []
})
export async function resetBuildLogger(file: string) {
    channel.show()
    //每次清空日志
    await vscode.workspace.fs.writeFile(vscode.Uri.file(file), new Uint8Array())
    channel.clear()

    logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({level, message, timestamp}) => {
                return `${timestamp} ${level}: ${message}`
            }),
        ),
        transports: [
            new winston.transports.Stream({
                stream: vscodeStream,
            }),
            new winston.transports.File({
                filename: file,
            }),
        ],
    })
}