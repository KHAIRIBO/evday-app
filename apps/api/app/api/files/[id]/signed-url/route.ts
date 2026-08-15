import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';
import { getStorageProvider } from '@/providers/storage';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id } = await params;

    const { data: file, error } = await admin
      .from('workspace_files')
      .select('storage_path')
      .eq('id', id)
      .eq('user_id', profileId)
      .maybeSingle();
    if (error) throw error;
    if (!file) throw new ApiError(404, 'NOT_FOUND', 'File not found');

    const { url } = await getStorageProvider().createSignedDownloadUrl(file.storage_path);
    return NextResponse.json({ data: { url } });
  } catch (error) {
    return errorResponse(error);
  }
}
