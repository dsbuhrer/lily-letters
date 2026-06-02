import { useEffect, useMemo, useState } from 'react';
import { Mail, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const CONTACT_SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'unread_first', label: 'Unread first' },
];

const contactComparators = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  name_asc: (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  unread_first: (a, b) => {
    const aUnread = a.read_at ? 1 : 0;
    const bUnread = b.read_at ? 1 : 0;
    return aUnread - bUnread || new Date(b.created_at) - new Date(a.created_at);
  },
};

function ContactStatusBadge({ readAt }) {
  const unread = !readAt;
  return (
    <span
      className={
        unread
          ? 'badge bg-gold/15 text-wine border-gold/40'
          : 'badge bg-ink/[0.06] text-ink-muted border-taupe/60'
      }
    >
      {unread ? 'New' : 'Read'}
    </span>
  );
}

export default function AdminContactsPage() {
  const { confirm, toast } = useUiFeedback();
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = unreadOnly ? { unread: '1' } : {};
    api.admin
      .contacts(params)
      .then((r) => setContacts(r.contacts || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [unreadOnly]);

  const filteredContacts = useMemo(() => {
    const matched = filterBySearch(contacts, search, (contact) => [
      contact.name,
      contact.email,
      contact.topic,
      contact.message,
    ]);
    return sortByKey(matched, sort, contactComparators);
  }, [contacts, search, sort]);

  const openContact = async (contact) => {
    setSelected(contact);
    if (!contact.read_at) {
      try {
        const { contact: updated } = await api.admin.updateContact(contact.id, { read: true });
        setContacts((list) => list.map((c) => (c.id === contact.id ? updated : c)));
        setSelected(updated);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const remove = async (id) => {
    const contact = contacts.find((c) => c.id === id) || (selected?.id === id ? selected : null);
    const ok = await confirm({
      title: 'Delete contact?',
      message: contact?.name
        ? `Remove the message from ${contact.name}? This cannot be undone.`
        : 'This contact message will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    await api.admin.deleteContact(id);
    setContacts((list) => list.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success('Contact deleted.');
  };

  const toggleUnread = async (contact) => {
    const { contact: updated } = await api.admin.updateContact(contact.id, { read: !contact.read_at });
    setContacts((list) => list.map((c) => (c.id === contact.id ? updated : c)));
    if (selected?.id === contact.id) setSelected(updated);
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-lead mt-1">Contact form submissions from the site</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            className="accent-wine"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, topic, message…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={CONTACT_SORT_OPTIONS}
        filteredCount={filteredContacts.length}
        totalCount={contacts.length}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 table-shell">
          {loading ? (
            <p className="data-table-empty">Loading…</p>
          ) : filteredContacts.length === 0 ? (
            <p className="data-table-empty">
              {contacts.length === 0 ? 'No contacts yet.' : 'No contacts match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-taupe/35 max-h-[70vh] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => openContact(contact)}
                    className={`w-full text-left p-4 transition-colors duration-150 hover:bg-cream/60 focus-visible:bg-cream/80 ${
                      selected?.id === contact.id ? 'bg-cream/90 ring-1 ring-inset ring-gold/25' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-wine truncate">{contact.name}</p>
                        <p className="text-xs text-ink-subtle truncate">{contact.email}</p>
                      </div>
                      <ContactStatusBadge readAt={contact.read_at} />
                    </div>
                    {contact.topic && (
                      <p className="text-xs text-ink-muted mt-2 truncate">{contact.topic}</p>
                    )}
                    <p className="text-xs text-ink-faint mt-1">
                      {new Date(contact.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 panel min-h-[320px] flex flex-col">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-ink-subtle">
              <Mail className="mb-3 text-gold" size={32} strokeWidth={1.25} />
              <p className="text-sm">Select a contact to view the full message</p>
            </div>
          ) : (
            <div className="panel-padding flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl text-wine">{selected.name}</h2>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-gold hover:text-wine hover:underline underline-offset-2 transition-colors"
                  >
                    {selected.email}
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ContactStatusBadge readAt={selected.read_at} />
                  <button
                    type="button"
                    className="btn-ghost text-xs py-1.5"
                    onClick={() => toggleUnread(selected)}
                  >
                    Mark as {selected.read_at ? 'unread' : 'read'}
                  </button>
                  <button
                    type="button"
                    className="table-action-danger inline-flex items-center gap-1"
                    onClick={() => remove(selected.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="form-label mb-0">Received</dt>
                  <dd className="mt-1 text-ink-muted">
                    {new Date(selected.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Topic</dt>
                  <dd className="mt-1 text-ink-muted">{selected.topic || '—'}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Source</dt>
                  <dd className="mt-1 text-ink-muted capitalize">{selected.source}</dd>
                </div>
                <div>
                  <dt className="form-label mb-0">Message</dt>
                  <dd className="mt-2 p-4 bg-cream/80 border border-taupe/50 font-body text-ink leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </dd>
                </div>
              </dl>

              <a href={`mailto:${selected.email}`} className="btn-primary inline-flex mt-6 gap-2">
                <Mail size={14} />
                Reply by email
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
