import { jsPDF } from 'jspdf';
import { Consent, ClinicSettings } from '../types';
import {
  uploadConsentPdf,
  getStorageSignedUrl,
  fetchSignatureAsDataUrl,
} from '../lib/consentStorage';

/**
 * Builds the jsPDF instance for a consent document.
 * Usa signatureData (data URL en memoria) o descarga signaturePath desde Storage.
 */
export async function buildConsentJsPdf(
  consent: Consent,
  clinicSettings: ClinicSettings
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const pageBottomLimit = 255;
  let y = 20;

  const shortId = consent.id ? `DOC-${consent.id.slice(0, 8).toUpperCase()}` : 'DOC-001';

  let signatureImage = consent.signatureData;
  if ((!signatureImage || !signatureImage.startsWith('data:image')) && consent.signaturePath) {
    signatureImage = (await fetchSignatureAsDataUrl(consent.signaturePath)) || undefined;
  }

  const renderPageHeader = (isFirstPage: boolean) => {
    if (isFirstPage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(189, 0, 60);
      doc.text(clinicSettings.clinicName.toUpperCase(), margin, y);

      y += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${clinicSettings.professionalName} — ${clinicSettings.professionalTitle}`,
        margin,
        y
      );

      if (clinicSettings.medicalLicense) {
        y += 4.5;
        doc.text(`Col: ${clinicSettings.medicalLicense}`, margin, y);
      }

      y += 7;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);

      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(consent.title, margin, y);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(140, 140, 140);
      doc.text(`REF: ${shortId}`, pageWidth - margin, y, { align: 'right' });

      y += 5;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120, 120, 120);
      doc.text(
        `Categoría: ${consent.category}  |  Versión: v${consent.templateVersion}`,
        margin,
        y
      );

      y += 8;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(40, 40, 40);
      doc.text('DATOS DEL PACIENTE', margin + 4, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 60, 60);
      doc.text(`Nombre Completo: ${consent.patientNameSnapshot}`, margin + 4, y + 11.5);
      doc.text(`DNI / NIF: ${consent.patientDniSnapshot}`, margin + 4, y + 16);

      y += 26;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(189, 0, 60);
      doc.text(clinicSettings.clinicName.toUpperCase(), margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`${consent.title} (REF: ${shortId})`, pageWidth - margin, y, { align: 'right' });

      y += 4;
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
  };

  renderPageHeader(true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text('CLÁUSULAS Y CONSENTIMIENTO INFORMADO', margin, y);

  y += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);

  const lines = doc.splitTextToSize(consent.contentSnapshot, contentWidth);
  const lineHeight = 4.2;

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > pageBottomLimit) {
      renderPageFooter(doc, shortId, pageWidth);
      doc.addPage();
      y = 20;
      renderPageHeader(false);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  y += 6;
  const signatureBlockHeight = 38;

  if (y + signatureBlockHeight > pageBottomLimit) {
    renderPageFooter(doc, shortId, pageWidth);
    doc.addPage();
    y = 25;
    renderPageHeader(false);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text('HOJA DE FIRMA Y CIERRE DEL DOCUMENTO', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Paciente: ${consent.patientNameSnapshot} (${consent.patientDniSnapshot})`, margin, y);
    y += 10;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text('FIRMA DEL PACIENTE', margin, y);

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const dateStr = consent.signedAt
    ? new Date(consent.signedAt).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
  doc.text(`Firma registrada el: ${dateStr}`, margin, y);

  y += 5;

  if (signatureImage && signatureImage.startsWith('data:image')) {
    try {
      doc.addImage(signatureImage, 'PNG', margin, y, 38, 15);
      y += 17;
    } catch (err) {
      console.warn('Could not embed signature image in PDF:', err);
    }
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${consent.patientNameSnapshot} — DNI ${consent.patientDniSnapshot}`, margin, y + 3);

  renderPageFooter(doc, shortId, pageWidth);
  return doc;
}

function renderPageFooter(doc: jsPDF, shortId: string, pageWidth: number) {
  const footerY = 283;
  const margin = 20;

  doc.setDrawColor(230, 230, 230);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Documento generado y firmado mediante la plataforma CONSENTIA · ID: ${shortId}`,
    margin,
    footerY
  );
}

export async function generateAndUploadConsentPdf(
  consent: Consent,
  clinicSettings: ClinicSettings
): Promise<{ pdfPath: string; pdfSize: number } | null> {
  try {
    const doc = await buildConsentJsPdf(consent, clinicSettings);
    const pdfBlob = doc.output('blob');
    const uploaded = await uploadConsentPdf(consent.id, pdfBlob);
    if (!uploaded) {
      return { pdfPath: `consent-${consent.id}.pdf`, pdfSize: pdfBlob.size };
    }
    return { pdfPath: uploaded.path, pdfSize: uploaded.size };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

export async function getConsentPdfSignedUrl(pdfPath: string): Promise<string | null> {
  return getStorageSignedUrl('consent-pdfs', pdfPath);
}

export async function openOrDownloadConsentPdf(
  consent: Consent,
  clinicSettings: ClinicSettings
) {
  if (consent.pdfPath) {
    const url = await getConsentPdfSignedUrl(consent.pdfPath);
    if (url) {
      window.open(url, '_blank');
      return;
    }
  }

  const doc = await buildConsentJsPdf(consent, clinicSettings);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
