// The "new enquiry" email sent to the owner. Pure (no Deno or Node APIs) so node:test can check it.
// Table layout with inline styles: Gmail and Outlook ignore <style> blocks and most modern CSS.
export type EnquiryRecord = {
  name: string
  email: string
  company?: string | null
  timeline?: string | null
  message: string
  created_at?: string
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const received = (iso?: string) =>
  new Date(iso ?? Date.now()).toLocaleString('en-GB', { timeZone: 'Asia/Tokyo', dateStyle: 'medium', timeStyle: 'short' }) + ' JST'

const INK = '#141513'
const PAPER = '#f4f3ee'
const MUTED = '#6f726b'
const LINE = '#d9d8d1'
const ACID = '#dfff42'
const MONO = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace"
const SANS = "'Manrope', 'Helvetica Neue', Arial, sans-serif"

export function enquiryEmail(r: EnquiryRecord, siteUrl: string) {
  const name = r.name.trim()
  const subject = `New enquiry from ${name}`
  // No live site yet (SITE_URL unset): leave the CMS links out rather than send broken ones.
  const cmsUrl = siteUrl.trim() ? `${siteUrl.trim().replace(/\/+$/, '')}/#/cms/enquiries` : ''
  const reply = `mailto:${encodeURIComponent(r.email)}?subject=${encodeURIComponent(`Re: your enquiry — ${name}`)}`
  // [label, plain value]; blank optional fields are left out.
  const details = [
    ['Email', r.email],
    ['Company', r.company?.trim() ?? ''],
    ['Timeline', r.timeline?.trim() ?? ''],
    ['Received', received(r.created_at)],
  ].filter(([, value]) => value)
  const cell = (label: string, value: string) =>
    label === 'Email' ? `<a href="mailto:${escape(value)}" style="color:${INK};">${escape(value)}</a>` : escape(value)

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${LINE};">
  <tr><td style="background:${INK};padding:22px 32px;">
    <span style="font-family:${SANS};font-size:20px;font-weight:700;letter-spacing:-1.5px;color:#f4f3ee;">RRDS</span><span style="font-family:${MONO};font-size:10px;color:${ACID};vertical-align:top;margin-left:3px;">®</span>
    <div style="margin-top:14px;font-family:${MONO};font-size:10px;letter-spacing:1.5px;color:${ACID};">NEW ENQUIRY / 新しいお問い合わせ</div>
  </td></tr>
  <tr><td style="padding:34px 32px 8px;">
    <div style="font-family:${MONO};font-size:10px;letter-spacing:1.2px;color:${MUTED};text-transform:uppercase;">From your portfolio contact form</div>
    <h1 style="margin:10px 0 0;font-family:${SANS};font-size:34px;line-height:1.05;font-weight:500;letter-spacing:-1.5px;color:${INK};">${escape(name)}</h1>
  </td></tr>
  <tr><td style="padding:22px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};">
      ${details
        .map(
          ([label, value]) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${LINE};width:110px;font-family:${MONO};font-size:10px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;vertical-align:top;">${label}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-family:${SANS};font-size:14px;color:${INK};">${cell(label, value)}</td>
      </tr>`,
        )
        .join('\n      ')}
    </table>
  </td></tr>
  <tr><td style="padding:26px 32px 0;">
    <div style="font-family:${MONO};font-size:10px;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Message</div>
    <div style="margin-top:10px;padding:18px 20px;border-left:3px solid ${INK};background:${PAPER};font-family:${SANS};font-size:15px;line-height:1.7;color:${INK};white-space:pre-wrap;">${escape(r.message.trim()).replace(/\r?\n/g, '<br>')}</div>
  </td></tr>
  <tr><td style="padding:30px 32px 34px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:${INK};"><a href="${escape(reply)}" style="display:inline-block;padding:13px 20px;font-family:${SANS};font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">Reply to ${escape(name)} &rarr;</a></td>
${
        cmsUrl
          ? `      <td style="width:10px;"></td>
      <td style="border:1px solid ${INK};"><a href="${escape(cmsUrl)}" style="display:inline-block;padding:12px 19px;font-family:${SANS};font-size:13px;font-weight:600;color:${INK};text-decoration:none;">Open in CMS &nearr;</a></td>`
          : ''
      }
    </tr></table>
  </td></tr>
  <tr><td style="padding:18px 32px;border-top:1px solid ${LINE};font-family:${MONO};font-size:10px;line-height:1.6;color:${MUTED};">
    Sent from the contact form on your portfolio${cmsUrl ? ` · <a href="${escape(cmsUrl)}" style="color:${MUTED};">Manage enquiries in your CMS</a>` : ''}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`

  const text = [
    `New enquiry from ${name}`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    r.message.trim(),
    ...(cmsUrl ? ['', `Open in CMS: ${cmsUrl}`] : []),
  ].join('\n')

  return { subject, html, text }
}
