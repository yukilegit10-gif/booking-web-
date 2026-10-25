import { NextResponse } from 'next/server';
import { getAdminSupabase, getServerSupabase } from '@/lib/supabase/server';
import { escapeHtml, telegram } from '@/lib/verification';
import { errorMessage } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    // 1. Lấy user từ phiên đăng nhập (KHÔNG tin userId từ body)
    const supabase = await getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập' }, { status: 401 });

    const { mssv, faculty, cardPath } = (await req.json()) as { mssv?: string; faculty?: string; cardPath?: string };
    const cleanMssv = String(mssv ?? '').trim();
    if (!/^\d{8,12}$/.test(cleanMssv)) {
      return NextResponse.json({ success: false, error: 'MSSV không hợp lệ (8–12 chữ số)' }, { status: 400 });
    }
    if (!faculty || !cardPath || !cardPath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin hoặc ảnh thẻ' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // 2. Lưu yêu cầu xác thực, trạng thái pending
    const { data: profile, error } = await admin
      .from('profiles')
      .update({ mssv: cleanMssv, faculty, student_card_path: cardPath, verification_status: 'pending', is_verified: false })
      .eq('id', user.id)
      .select('full_name')
      .single();
    if (error) {
      const msg = error.code === '23505' ? 'MSSV này đã được dùng bởi tài khoản khác' : error.message;
      return NextResponse.json({ success: false, error: msg }, { status: 400 });
    }

    // 3. Gửi ảnh thẻ (signed URL 24h vì bucket private) về Telegram Group
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (process.env.TELEGRAM_BOT_TOKEN && chatId) {
      const { data: signed } = await admin.storage.from('student-cards').createSignedUrl(cardPath, 60 * 60 * 24);
      const caption =
        `🚨 <b>YÊU CẦU XÁC THỰC MSSV HUIT</b>\n\n` +
        `- Họ tên: ${escapeHtml(profile.full_name)}\n` +
        `- Mã SV: <code>${escapeHtml(cleanMssv)}</code>\n` +
        `- Khoa: ${escapeHtml(faculty)}\n` +
        `- Email: ${escapeHtml(user.email ?? '')}\n` +
        `- User ID: <code>${user.id}</code>`;
      await telegram('sendPhoto', {
        chat_id: chatId,
        photo: signed?.signedUrl,
        caption,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Duyệt', callback_data: `verify_approve_${user.id}` },
              { text: '❌ Từ chối', callback_data: `verify_reject_${user.id}` },
            ],
          ],
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: errorMessage(error) }, { status: 500 });
  }
}
