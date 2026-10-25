import { NextResponse } from 'next/server';
import { setVerification, telegram, escapeHtml } from '@/lib/verification';
import { errorMessage } from '@/lib/utils';

interface CallbackQuery {
  id: string;
  data?: string;
  from: { first_name?: string; username?: string };
  message?: { message_id: number; chat: { id: number }; caption?: string };
}

/**
 * Nhận nút "✅ Duyệt / ❌ Từ chối" từ Telegram.
 * Đăng ký webhook:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<DOMAIN>/api/telegram-webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await req.json()) as { callback_query?: CallbackQuery };
  const cq = update.callback_query;
  if (!cq?.data || !cq.message) return NextResponse.json({ ok: true });

  // Chỉ chấp nhận thao tác từ group duyệt của team
  if (String(cq.message.chat.id) !== String(process.env.TELEGRAM_CHAT_ID)) {
    return NextResponse.json({ ok: true });
  }

  const match = /^verify_(approve|reject)_([0-9a-f-]{36})$/.exec(cq.data);
  if (!match) return NextResponse.json({ ok: true });
  const approve = match[1] === 'approve';
  const userId = match[2];
  const who = cq.from.username ? `@${cq.from.username}` : cq.from.first_name ?? 'admin';

  try {
    const p = await setVerification(userId, approve);
    await telegram('answerCallbackQuery', { callback_query_id: cq.id, text: approve ? 'Đã duyệt ✅' : 'Đã từ chối ❌' });
    await telegram('editMessageCaption', {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      parse_mode: 'HTML',
      caption:
        `${approve ? '✅ <b>ĐÃ DUYỆT</b>' : '❌ <b>ĐÃ TỪ CHỐI</b>'} bởi ${escapeHtml(who)}\n\n` +
        `- Họ tên: ${escapeHtml(p.full_name)}\n- Mã SV: <code>${escapeHtml(p.mssv ?? '')}</code>\n- User ID: <code>${userId}</code>`,
    });
  } catch (e) {
    await telegram('answerCallbackQuery', { callback_query_id: cq.id, text: `Lỗi: ${errorMessage(e)}`.slice(0, 190), show_alert: true });
  }

  return NextResponse.json({ ok: true });
}
