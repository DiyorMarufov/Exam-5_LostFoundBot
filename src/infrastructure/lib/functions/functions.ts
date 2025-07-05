import { config } from 'src/config';
import { errorCatch } from '../exception/error.catch';
import axios from 'axios';
import { SessionContext } from 'src/api/bot/bot.service';
import { LocationDistrict } from 'src/common/enum';

export async function sendMessageFunctionAcceptance(
  chat_id: number,
  text: string,
): Promise<object | undefined> {
  const token = config.BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    await axios.post(url, {
      chat_id,
      text,
      parse_mode: 'Markdown',
    });
  } catch (e) {
    return errorCatch(e);
  }
}

export async function sendMessageFuncionReject(
  chat_id: number,
  text: string,
  ctx: SessionContext,
): Promise<object | undefined> {
  const token = config.BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  if (ctx.session) {
    var itemId = ctx.session.itemId;
  }

  try {
    await axios.post(url, {
      chat_id,
      text,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🔁 Qayta yuborish',
              callback_data: `resend_item:${itemId}`,
            },
          ],
          [{ text: '❌ O‘chirish', callback_data: `delete_item:${itemId}` }],
        ],
      },
      parse_mode: 'Markdown',
    });
  } catch (e) {
    return errorCatch(e);
  }
}

export async function checkItemLocationDescription(
  ctx: SessionContext,
  text: string,
): Promise<object | undefined> {
  try {
    const inputDistrict = text.split(' ')[0].toLowerCase();

    if (ctx.session) {
      if (ctx.session.district !== inputDistrict) {
        await ctx.reply(
          'Oldin kiritgan tumaningiz bilan hozir kiritgan tumaningiz bir xil emas.',
        );
        return;
      }
      ctx.session.descriptionLocation = text;
    }
  } catch (e) {
    return errorCatch(e);
  }
}
