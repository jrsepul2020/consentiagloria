import { supabase } from './supabaseClient';

const PDF_BUCKET = 'consent-pdfs';
const SIGNATURE_BUCKET = 'consent-signatures';
const CLINIC_BUCKET = 'clinic-assets';

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Sube la firma PNG a Storage. No guarda base64 en la BD. */
export async function uploadConsentSignature(
  consentId: string,
  signatureDataUrl: string
): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(signatureDataUrl);
    const path = `sig-${consentId}-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from(SIGNATURE_BUCKET).upload(path, blob, {
      contentType: 'image/png',
      upsert: true,
    });
    if (error) {
      console.error('Error uploading signature:', error.message);
      return null;
    }
    return data?.path || path;
  } catch (err) {
    console.error('uploadConsentSignature failed:', err);
    return null;
  }
}

export async function uploadConsentPdf(
  consentId: string,
  pdfBlob: Blob
): Promise<{ path: string; size: number } | null> {
  try {
    const path = `consent-${consentId}-${Date.now()}.pdf`;
    const { data, error } = await supabase.storage.from(PDF_BUCKET).upload(path, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) {
      console.error('Error uploading PDF:', error.message);
      return null;
    }
    return { path: data?.path || path, size: pdfBlob.size };
  } catch (err) {
    console.error('uploadConsentPdf failed:', err);
    return null;
  }
}

/** Sube la firma de la doctora (PNG/JPEG) a clinic-assets. */
export async function uploadDoctorSignature(dataUrl: string): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const path = `doctor-signature-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from(CLINIC_BUCKET).upload(path, blob, {
      contentType: blob.type || 'image/png',
      upsert: true,
    });
    if (error) {
      console.error('Error uploading doctor signature:', error.message);
      return null;
    }
    return data?.path || path;
  } catch (err) {
    console.error('uploadDoctorSignature failed:', err);
    return null;
  }
}

export async function getStorageSignedUrl(
  bucket: 'consent-pdfs' | 'consent-signatures' | 'clinic-assets',
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/** Descarga firma como data URL para embeber en PDF (sesión de generación). */
export async function fetchSignatureAsDataUrl(
  signaturePath: string,
  bucket: 'consent-signatures' | 'clinic-assets' = 'consent-signatures'
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(signaturePath);
    if (error || !data) return null;
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(data);
    });
  } catch {
    return null;
  }
}
