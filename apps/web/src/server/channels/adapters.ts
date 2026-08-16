import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  appendMessage,
  assertPrivateDataAccess,
  createThread,
  findThreadByChannel,
  getThread,
} from '../conversations/hub';

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string,
  appSecret: string,
): boolean {
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

export async function handleWhatsAppInbound(input: {
  from: string;
  body: string;
  isPromotional?: boolean;
  hasMarketingConsent?: boolean;
}): Promise<{ threadId: string; reply: string }> {
  if (input.isPromotional && !input.hasMarketingConsent) {
    throw new Error('Promotional WhatsApp messages require valid consent');
  }
  if (/stop|unsubscribe/i.test(input.body)) {
    return { threadId: 'opt-out', reply: 'You are opted out of WhatsApp promotions.' };
  }

  let thread = await findThreadByChannel('whatsapp', input.from);
  if (!thread) {
    thread = await createThread({ channel: 'whatsapp', externalId: input.from });
  }
  await appendMessage(thread.id, { direction: 'inbound', body: input.body });

  let reply =
    'Thanks for messaging Aotearoa Trails on WhatsApp. Link your account with a verification code before private booking access.';
  if (/booking|order/i.test(input.body)) {
    try {
      const fresh = (await getThread(thread.id))!;
      assertPrivateDataAccess(fresh);
      reply = 'Linked identity verified — booking summary tools can run.';
    } catch {
      reply = 'I can help generally, but private booking details require a verified account link.';
    }
  }
  await appendMessage(thread.id, { direction: 'outbound', body: reply });
  return { threadId: thread.id, reply };
}

export async function handleTelegramInbound(input: {
  chatId: string;
  body: string;
}): Promise<{ threadId: string; reply: string }> {
  let thread = await findThreadByChannel('telegram', input.chatId);
  if (!thread) {
    thread = await createThread({ channel: 'telegram', externalId: input.chatId });
  }
  await appendMessage(thread.id, { direction: 'inbound', body: input.body });
  let reply = 'Telegram connected. Private bookings stay hidden until account linking is verified.';
  if (/booking/i.test(input.body)) {
    try {
      assertPrivateDataAccess((await getThread(thread.id))!);
      reply = 'Linked Telegram identity — booking tools allowed.';
    } catch {
      reply = 'Unverified Telegram identity cannot access private booking data.';
    }
  }
  await appendMessage(thread.id, { direction: 'outbound', body: reply });
  return { threadId: thread.id, reply };
}

export function handleVoiceTool(input: {
  tool:
    | 'identify_customer'
    | 'get_booking_summary'
    | 'get_itinerary'
    | 'create_support_case'
    | 'transfer_human';
  values: Record<string, string>;
  confirmedReadback: boolean;
}): { ok: boolean; message: string } {
  const sensitive = ['name', 'email', 'date', 'bookingReference'];
  const touched = sensitive.some((key) => key in input.values);
  if (touched && !input.confirmedReadback) {
    return {
      ok: false,
      message: 'Please confirm the read-back of name/email/date/booking reference before continuing.',
    };
  }
  switch (input.tool) {
    case 'transfer_human':
      return {
        ok: true,
        message: `Transferring with summary: ${JSON.stringify(input.values).slice(0, 200)}`,
      };
    case 'create_support_case':
      return { ok: true, message: 'Support case created' };
    default:
      return { ok: true, message: `Executed ${input.tool} under policy controls` };
  }
}
