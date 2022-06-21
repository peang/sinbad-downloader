// const TelegramBot = require('node-telegram-bot-api');

import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramBotService extends TelegramBot {
  private bot: any;
  private needToDelete: any = [];

  constructor() {
    super();
    const token = process.env.BOT_TOKEN;
    this.bot = new TelegramBot(token, { polling: true });
  }

  public async sendDocument(chatId, data, options, payload) {
    this.bot.sendDocument(chatId, data, options, payload);
  }

  public async sendMessage(chatId, message, del = true) {
    this.bot.sendMessage(chatId, message).then((msg) => {
      if (del) {
        this.needToDelete.push(msg.message_id);
      }
    });
  }

  public async deleteMessages(chatId) {
    this.needToDelete.map((msgId) => {
      this.bot.deleteMessage(chatId, msgId);
    });

    this.needToDelete = [];
  }
}
