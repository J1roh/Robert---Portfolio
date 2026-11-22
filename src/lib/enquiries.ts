import { api, jsonBody } from './api.ts'

// One row of the D1 `enquiries` table (worker/schema.sql).
export type EnquiryFields = { name: string; email: string; company: string; service: string; timeline: string; message: string }
export type EnquiryStatus = 'inbox' | 'archived' | 'deleted'
export type Enquiry = EnquiryFields & { id: string; created_at: string; read: boolean; status: EnquiryStatus; deleted_at: string | null }

// "Recently deleted" keeps messages this long; the server removes older ones when the inbox loads (worker/index.ts).
export const DELETED_DAYS = 30

// 'sent', 'duplicate' (3 already from this email or network within 2 days), or an error message.
export async function sendEnquiry(fields: EnquiryFields): Promise<'sent' | 'duplicate' | { error: string }> {
  const { error, status } = await api('enquiries', jsonBody('POST', fields))
  if (!error) return 'sent'
  if (status === 409) return 'duplicate'
  if (error.startsWith('bad_email')) return { error: 'That email address can’t receive mail. Please check it and try again.' }
  if (error.startsWith('invalid')) return { error: 'Please check the form: name, a valid email and a message are required.' }
  return { error }
}

// Unread messages outside "Recently deleted", for the CMS sidebar badge; 0 if it can't be read.
export async function countUnread(): Promise<number> {
  return (await api<{ count: number }>('enquiries/unread')).data?.count ?? 0
}

export async function loadEnquiries(): Promise<{ enquiries: Enquiry[]; error: string | null }> {
  const { data, error } = await api<Enquiry[]>('enquiries')
  return { enquiries: data ?? [], error }
}

export async function updateEnquiry(id: string, patch: Partial<Pick<Enquiry, 'read' | 'status' | 'deleted_at'>>): Promise<string | null> {
  return (await api(`enquiries/${encodeURIComponent(id)}`, jsonBody('PATCH', patch))).error
}
