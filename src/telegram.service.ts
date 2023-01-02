import { CACHE_MANAGER, Inject, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager-ioredis';
import * as fs from 'fs';
import * as http from 'http';
import * as TelegramBot from 'node-telegram-bot-api';
import * as path from 'path';

export class TelegramService {
  private readonly logger = new Logger('Sinbad Downloader Service');
  private bot: any;
  private needToDelete: any = [];
  private username: string;

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {
    const token = process.env.BOT_TOKEN;
    this.bot = new TelegramBot(token, { polling: true });

    this.bot.onText(/\/sinbadredstaging/, async (msg) => {
      this.username = msg.chat.username;
      const chatId = msg.chat.id;
      const url = process.env.SINBAD_RED_STAGING_URL;

      this.getFile(chatId, 'staging', url);
    });

    this.bot.onText(/\/sinbadreddev/, (msg) => {
      this.username = msg.chat.username;
      const chatId = msg.chat.id;
      const url = process.env.SINBAD_RED_DEV_URL;

      this.getFile(chatId, 'development', url);
    });

    this.bot.onText(/\/sinbadredsandbox/, (msg) => {
      this.username = msg.chat.username;
      const chatId = msg.chat.id;
      const url = process.env.SINBAD_RED_SANDBOX_URL;

      this.getFile(chatId, 'sandbox', url);
    });

    this.bot.onText(/\/sinbadredproduction/, (msg) => {
      this.username = msg.chat.username;
      const chatId = msg.chat.id;
      const url = process.env.SINBAD_RED_PRODUCTION_URL;

      this.getFile(chatId, 'production', url);
    });

    this.bot.onText(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      (msg) => {
        this.username = msg.chat.username;
        const chatId = msg.chat.id;
        const url = msg.text;

        const urlData = url.split('/');
        this.getFile(chatId, urlData[4], url);
      },
    );
  }

  public async getFile(chatId, environment, url) {
    // this.username = await this.cache.get(chatId);
    // if (!this.username) {
    //   this.logger.log(`Unknown User ${chatId}`);
    // }
    this.logger.log(`Downloading ${environment} by ${this.username}..`);
    const env = environment.toUpperCase();

    try {
      http.get(url, (res) => {
        const fileSize = Number(res.headers['content-length']);

        this.bot.sendMessage(chatId, `Downloading Sinbad ${env} ...`);
        //   const downloadPath = `${__dirname}/downloads/sinbad-${environment}-${chatId}.tar.gz`;
        const downloadPath = path.resolve(
          __dirname,
          '..',
          `downloads/sinbad-${environment}-${chatId}.apk`,
        );

        const filePath = fs.createWriteStream(downloadPath);

        let written = 0;
        let flagValue = 0;

        res.pipe(filePath);
        res.on('data', (chunk) => {
          written += chunk.length;
          const progress = (written / fileSize) * 100;
          const percentProgress = Number(progress.toFixed(1));
          if (percentProgress >= 10) {
            if (percentProgress % 10 == 0) {
              if (Number(progress.toFixed(0)) !== flagValue) {
                flagValue = Number(progress.toFixed(0));
                if (flagValue !== 100) {
                  this.deleteMessages(chatId);
                  this.sendMessage(
                    chatId,
                    `Downloading Sinbad ${env} at ${(
                      written /
                      1024 /
                      1024
                    ).toFixed(0)} MB of ${(fileSize / 1024 / 1024).toFixed(
                      0,
                    )} MB`,
                  );
                }
              }
            }
          }
        });

        filePath.on('finish', () => {
          filePath.close();
          this.sendMessage(chatId, 'Download Complete √');
          // decompress(downloadPath, 'extracted').then((files) => {
          // files.forEach((file) => {
          // if (file.path.includes('arm64')) {
          this.sendMessage(chatId, 'Please Wait, Sending File to You ...');
          this.bot
            .sendDocument(
              chatId,
              fs.readFileSync(downloadPath),
              {},
              {
                filename: `sinbad-${environment}.apk`,
                contentType: 'application/octet-stream',
              },
            )
            .finally(() => {
              this.deleteMessages(chatId);

              try {
                fs.rmSync(downloadPath, { force: true });
                // fs.rmSync('./extracted', {
                //   force: true,
                //   recursive: true,
                // });
              } catch (err) {
                console.error(err);
                console.log('Failed Remove Folder');
              }
            });
          // }
          // });
          // });
        });
      });
    } catch (err) {
      this.bot.sendMessage(chatId, err.message);
    }
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
