import { useEffect, useMemo, useState } from 'react';
import { Mail, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const LEAD_SORT_OPTIONS = [
  { value: 'created_desc', label: 'Newest first' },
  { value: 'created_asc', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'unread_first', label: 'Unread first' },
];

const leadComparators = {
  created_desc: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  created_asc: (a, b) => new Date(a.created_at) - new Date(b.created_at),
  name_asc: (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
  unread_first: (a, b) => {
    const aUnread = a.read_at ? 1 : 0;
    const bUnread = b.read_at ? 1 : 0;
    return aUnread - bUnread || new Date(b.created_at) - new Date(a.created_at);
  },
};

function LeadStatusBadge({ readAt }) {
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

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = unreadOnly ? { unread: '1' } : {};
    api.admin
      .leads(params)
      .then((r) => setLeads(r.leads || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [unreadOnly]);

  const filteredLeads = useMemo(() => {
    const matched = filterBySearch(leads, search, (lead) => [
      lead.name,
      lead.email,
      lead.topic,
      lead.message,
    ]);
    return sortByKey(matched, sort, leadComparators);
  }, [leads, search, sort]);

  const openLead = async (lead) => {
    setSelected(lead);
    if (!lead.read_at) {
      try {
        const { lead: updated } = await api.admin.updateLead(lead.id, { read: true });
        setLeads((list) => list.map((l) => (l.id === lead.id ? updated : l)));
        setSelected(updated);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this lead?')) return;
    await api.admin.deleteLead(id);
    setLeads((list) => list.filter((l) => l.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const toggleUnread = async (lead) => {
    const { lead: updated } = await api.admin.updateLead(lead.id, { read: !lead.read_at });
    setLeads((list) => list.map((l) => (l.id === lead.id ? updated : l)));
    if (selected?.id === lead.id) setSelected(updated);
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl text-wine">Leads</h1>
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
        sortOptions={LEAD_SORT_OPTIONS}
        filteredCount={filteredLeads.length}
        totalCount={leads.length}
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white/80 border border-taupe overflow-hidden">
          {loading ? (
            <p className="p-8 text-[#2d2020]/50 text-sm">Loading…</p>
          ) : filteredLeads.length === 0 ? (
            <p className="p-8 text-center text-[#2d2020]/50 text-sm">
              {leads.length === 0 ? 'No leads yet.' : 'No leads match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-taupe/40 max-h-[70vh] overflow-y-auto">
              {filteredLeads.map((lead) => (
                <li key={lead.id}>
                  <button
                    type="button"
                    onClick={() => openLead(lead)}
                    className={`w-full text-left p-4 hover:bg-cream/60 transition-colors ${
                      selected?.id === lead.id ? 'bg-cream' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-wine truncate">{lead.name}</p>
                        <p className="text-xs text-[#2d2020]/50 truncate">{lead.email}</p>
                      </div>
                      <LeadStatusBadge readAt={lead.read_at} />
                    </div>
                    {lead.topic && (
                      <p className="text-xs text-[#2d2020]/60 mt-2 truncate">{lead.topic}</p>
                    )}
                    <p className="text-xs text-[#2d2020]/40 mt-1">
                      {new Date(lead.created_at).toLocaleString()}
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
              <p className="text-sm">Select a lead to view the full message</p>
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
                  <LeadStatusBadge readAt={selected.read_at} />
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
