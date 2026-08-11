import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const POST_SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Updated (newest)' },
  { value: 'updated_asc', label: 'Updated (oldest)' },
  { value: 'views_desc', label: 'Views (high → low)' },
  { value: 'views_asc', label: 'Views (low → high)' },
  { value: 'title_asc', label: 'Title (A–Z)' },
  { value: 'title_desc', label: 'Title (Z–A)' },
  { value: 'status', label: 'Status (draft first)' },
];

const postComparators = {
  updated_desc: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  updated_asc: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
  views_desc: (a, b) => (b.view_count || 0) - (a.view_count || 0),
  views_asc: (a, b) => (a.view_count || 0) - (b.view_count || 0),
  title_asc: (a, b) => (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' }),
  title_desc: (a, b) => (b.title || '').localeCompare(a.title || '', undefined, { sensitivity: 'base' }),
  status: (a, b) => {
    const order = { draft: 0, published: 1 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2) || (a.title || '').localeCompare(b.title || '');
  },
};

function PostStatusLabel({ status }) {
  const isPublished = status === 'published';
  return (
    <span className={`badge ${isPublished ? 'badge-published' : 'badge-draft'}`}>
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

export default function AdminPostsPage() {
  const { confirm, toast } = useUiFeedback();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updated_desc');

  useEffect(() => {
    api.admin.posts().then((r) => setPosts(r.posts || [])).catch(console.error);
  }, []);

  const filteredPosts = useMemo(() => {
    const matched = filterBySearch(posts, search, (post) => [
      post.title,
      post.slug,
      post.status,
      post.excerpt,
    ]);
    return sortByKey(matched, sort, postComparators);
  }, [posts, search, sort]);

  const remove = async (id) => {
    const post = posts.find((p) => p.id === id);
    const ok = await confirm({
      title: 'Delete post?',
      message: post?.title
        ? `"${post.title}" will be permanently removed.`
        : 'This post will be permanently removed.',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    await api.admin.deletePost(id);
    setPosts((p) => p.filter((x) => x.id !== id));
    toast.success('Post deleted.');
  };

  const publish = async (post) => {
    const ok = await confirm({
      title: 'Publish post?',
      message: `"${post.title}" will be visible on the blog.`,
      confirmLabel: 'Publish',
    });
    if (!ok) return;
    try {
      const { post: updated } = await api.admin.publishPost(post.id);
      setPosts((p) => p.map((x) => (x.id === post.id ? { ...x, ...updated, status: 'published' } : x)));
      toast.success('Post published.');
    } catch (e) {
      toast.error(e.message || 'Could not publish.');
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1 className="page-title">Posts</h1>
        <Link to="/admin/posts/new" className="btn-primary">
          New post
        </Link>
      </header>

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, slug, status…"
        sort={sort}
        onSortChange={setSort}
        sortOptions={POST_SORT_OPTIONS}
        filteredCount={filteredPosts.length}
        totalCount={posts.length}
      />

      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th className="text-right">Views</th>
              <th>Updated</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="data-table-empty">
                  {posts.length === 0 ? 'No posts yet.' : 'No posts match your search.'}
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <Link to={`/admin/posts/${post.id}`} className="table-action font-medium">
                      {post.title}
                    </Link>
                    <p className="text-xs text-ink-subtle mt-1">/blog/{post.slug}</p>
                  </td>
                  <td>
                    <PostStatusLabel status={post.status} />
                  </td>
                  <td className="text-right tabular-nums">{(post.view_count || 0).toLocaleString()}</td>
                  <td className="tabular-nums">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                      {post.status !== 'published' && (
                        <button type="button" onClick={() => publish(post)} className="table-action">
                          Publish
                        </button>
                      )}
                      {post.status === 'published' && post.slug && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-muted"
                        >
                          View
                        </a>
                      )}
                      <Link to={`/admin/posts/${post.id}`} className="table-action">
                        Edit
                      </Link>
                      <button type="button" onClick={() => remove(post.id)} className="table-action-danger">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
