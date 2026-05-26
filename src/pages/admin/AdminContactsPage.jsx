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
      className={`inline-block text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
        unread
          ? 'bg-gold/15 text-wine border-gold/40'
          : 'bg-[#2d2020]/5 text-[#2d2020]/60 border-taupe'
      }`}
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
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-wine">Contacts</h1>
          <p className="text-sm text-[#2d2020]/50 mt-1">Contact form submissions from the site</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[#2d2020]/70">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
      </div>

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
        <div className="lg:col-span-2 bg-white/80 border border-taupe overflow-hidden">
          {loading ? (
            <p className="p-8 text-[#2d2020]/50 text-sm">Loading…</p>
          ) : filteredContacts.length === 0 ? (
            <p className="p-8 text-center text-[#2d2020]/50 text-sm">
              {contacts.length === 0 ? 'No contacts yet.' : 'No contacts match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-taupe/40 max-h-[70vh] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <li key={contact.id}>
                  <button
                    type="button"
                    onClick={() => openContact(contact)}
                    className={`w-full text-left p-4 hover:bg-cream/60 transition-colors ${
                      selected?.id === contact.id ? 'bg-cream' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-wine truncate">{contact.name}</p>
                        <p className="text-xs text-[#2d2020]/50 truncate">{contact.email}</p>
                      </div>
                      <ContactStatusBadge readAt={contact.read_at} />
                    </div>
                    {contact.topic && (
                      <p className="text-xs text-[#2d2020]/60 mt-2 truncate">{contact.topic}</p>
                    )}
                    <p className="text-xs text-[#2d2020]/40 mt-1">
                      {new Date(contact.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-3 bg-white/80 border border-taupe min-h-[320px]">
          {!selected ? (
            <div className="p-10 text-center text-[#2d2020]/45">
              <Mail className="mx-auto mb-3 text-gold" size={32} strokeWidth={1.25} />
              <p className="text-sm">Select a contact to view the full message</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl text-wine">{selected.name}</h2>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-gold hover:text-wine hover:underline"
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
                    className="text-red-600 text-xs hover:underline inline-flex items-center gap-1"
                    onClick={() => remove(selected.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    type="button"
                    className="p-1 text-[#2d2020]/40 hover:text-wine"
                    aria-label="Close"
                    onClick={() => setSelected(null)}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-[#2d2020]/50">Received</dt>
                  <dd className="mt-1 text-[#2d2020]/80">
                    {new Date(selected.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-[#2d2020]/50">Topic</dt>
                  <dd className="mt-1 text-[#2d2020]/80">{selected.topic || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-[#2d2020]/50">Source</dt>
                  <dd className="mt-1 text-[#2d2020]/80 capitalize">{selected.source}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-[#2d2020]/50">Message</dt>
                  <dd className="mt-2 p-4 bg-cream/80 border border-taupe/50 font-body text-[#2d2020] leading-relaxed whitespace-pre-wrap">
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
