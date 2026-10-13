import { supabase } from './supabase.ts'

// One row of the Supabase `enquiries` table (supabase/mitigations/02_create_enquiries_table.sql, 03_enquiry_folders.sql).
export type EnquiryFields = { name: string; email: string; company: string; service: string; timeline: string; message: string }
export type EnquiryStatus = 'inbox' | 'archived' | 'deleted'
const STATUSES: unknown[] = ['inbox', 'archived', 'deleted'] satisfies EnquiryStatus[]
export type Enquiry = EnquiryFields & { id: string; created_at: string; read: boolean; status: EnquiryStatus; deleted_at: string | null }

// "Recently deleted" keeps messages this long; older ones are removed for good when the inbox loads.
export const DELETED_DAYS = 30

const explain = (message: string) =>
  message.includes('schema cache') || message.includes('column')
    ? 'The enquiries table is missing or out of date in Supabase. Run supabase/mitigations/02_create_enquiries_table.sql and 03_enquiry_folders.sql in the Supabase SQL editor.'
    : message

// 'sent', 'duplicate' (same email or network within 24 hours, see supabase/mitigations/05), or an error message.
// No .select(): visitors may insert but not read the table back.
export async function sendEnquiry(fields: EnquiryFields): Promise<'sent' | 'duplicate' | { error: string }> {
  if (!supabase) return { error: 'Supabase is not configured.' }
  const { error } = await supabase.from('enquiries').insert(fields)
  if (!error) return 'sent'
  return error.message.includes('already_submitted') ? 'duplicate' : { error: explain(error.message) }
}

// Unread messages outside "Recently deleted", for the CMS sidebar badge; 0 if it can't be read.
export async function countUnread(): Promise<number> {
  if (!supabase) return 0
  // Rows with no read flag or status count as unread Inbox mail, matching loadEnquiries.
  const { count } = await supabase
    .from('enquiries')
    .select('id', { count: 'exact', head: true })
    .or('read.is.null,read.eq.false')
    .or('status.is.null,status.neq.deleted')
  return count ?? 0
}

export async function loadEnquiries(): Promise<{ enquiries: Enquiry[]; error: string | null }> {
  if (!supabase) return { enquiries: [], error: 'Supabase is not configured.' }
  // Best effort: a failed purge just leaves old deleted messages for the next load.
  const cutoff = new Date(Date.now() - DELETED_DAYS * 864e5).toISOString()
  await supabase.from('enquiries').delete().eq('status', 'deleted').lt('deleted_at', cutoff)
  const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false })
  // Rows saved before the folder columns had defaults can have no status or read flag (see mitigations/06);
  // treat them as unread Inbox mail so they're never invisible in every folder.
  const enquiries = (data ?? []).map((e) => ({
    ...e,
    status: STATUSES.includes(e.status) ? e.status : 'inbox',
    read: e.read === true,
  })) as Enquiry[]
  return { enquiries, error: error ? explain(error.message) : null }
}

export async function updateEnquiry(id: string, patch: Partial<Pick<Enquiry, 'read' | 'status' | 'deleted_at'>>): Promise<string | null> {
  if (!supabase) return 'Supabase is not configured.'
  const { error } = await supabase.from('enquiries').update(patch).eq('id', id)
  return error ? explain(error.message) : null
}
