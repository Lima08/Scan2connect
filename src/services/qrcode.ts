import QRCode from 'qrcode'

export async function generateQRPng(shortId: string, baseUrl: string): Promise<Buffer> {
  const url = `${baseUrl.replace(/\/$/, '')}/${shortId}`
  return QRCode.toBuffer(url, { width: 300, margin: 2, type: 'png' })
}
