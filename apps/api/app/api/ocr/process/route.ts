import { OcrProcessInput, OcrResult } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { admin } from '@/lib/supabase-admin';
import { extractTextFromImage } from '@/providers/ai/anthropic';
import { getStorageProvider } from '@/providers/storage';

function toRecord(row: Record<string, unknown>) {
  return OcrResult.parse({
    id: row.id,
    fileId: row.file_id,
    extractedText: row.extracted_text,
    processingStatus: row.processing_status,
    createdAt: row.created_at,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const parsed = OcrProcessInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    const { data: file, error } = await admin
      .from('workspace_files')
      .select('id, storage_path, mime_type')
      .eq('id', parsed.data.fileId)
      .eq('user_id', profileId)
      .maybeSingle();
    if (error) throw error;
    if (!file) throw new ApiError(404, 'NOT_FOUND', 'File not found');
    if (!file.mime_type?.startsWith('image/')) {
      throw new ApiError(422, 'UNSUPPORTED_TYPE', 'OCR currently only supports image files');
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new ApiError(500, 'CONFIG_ERROR', 'ANTHROPIC_API_KEY is not set');

    const { data: pending, error: pendingErr } = await admin
      .from('ocr_results')
      .insert({ file_id: file.id, processing_status: 'pending' })
      .select('id')
      .single();
    if (pendingErr) throw new ApiError(500, 'DB_ERROR', pendingErr.message);

    try {
      const { url } = await getStorageProvider().createSignedDownloadUrl(file.storage_path);
      const text = await extractTextFromImage(apiKey, url);

      const { data: result, error: updateErr } = await admin
        .from('ocr_results')
        .update({ extracted_text: text, processing_status: 'completed' })
        .eq('id', pending.id)
        .select()
        .single();
      if (updateErr) throw new ApiError(500, 'DB_ERROR', updateErr.message);

      return NextResponse.json({ data: toRecord(result) });
    } catch (ocrError) {
      await admin.from('ocr_results').update({ processing_status: 'failed' }).eq('id', pending.id);
      throw ocrError;
    }
  } catch (error) {
    return errorResponse(error);
  }
}
