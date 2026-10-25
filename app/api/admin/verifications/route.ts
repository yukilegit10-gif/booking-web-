import { NextResponse } from 'next/server';
import { getAdminSupabase, getServerSupabase, isAdminEmail } from '@/lib/supabase/server';
import { setVerification } from '@/lib/verification';
import { errorMessage } from '@/lib/utils';

async function requireAdmin() {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Vui lòng đăng nhập' }, { status: 401 }) };
  if (!isAdminEmail(user.email)) {
    return { error: NextResponse.json({ error: 'Tài khoản không có quyền Admin (thêm email vào ADMIN_EMAILS)' }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  try {
    const admin = getAdminSupabase();
    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);

    const items = await Promise.all(
      (data ?? []).map(async (profile) => {
        let card_url: string | null = null;
        if (profile.student_card_path) {
          const { data: signed } = await admin.storage.from('student-cards').createSignedUrl(profile.student_card_path, 600);
          card_url = signed?.signedUrl ?? null;
        }
        return { profile, card_url };
      }),
    );
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  try {
    const { userId, approve } = (await req.json()) as { userId: string; approve: boolean };
    await setVerification(userId, Boolean(approve));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 500 });
  }
}
