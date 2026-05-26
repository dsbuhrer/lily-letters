import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useUiFeedback } from '../../context/UiFeedbackContext';
import AdminListToolbar from '../../components/admin/AdminListToolbar';
import { filterBySearch, sortByKey } from '../../utils/adminListFilter';

const POST_SORT_OPTIONS = [
  { value: 'updated_desc', label: 'Updated (newest)' },
  { value: 'updated_asc', label: 'Updated (oldest)' },
  { value: 'title_asc', label: 'Title (A–Z)' },
  { value: 'title_desc', label: 'Title (Z–A)' },
  { value: 'status', label: 'Status (draft first)' },
];

const postComparators = {
  updated_desc: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  updated_asc: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
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
    <span
      className={`inline-block text-[10px] uppercase tracking-widest px-2.5 py-1 border ${
        isPublished
          ? 'bg-wine/10 text-wine border-wine/25'
          : 'bg-[#2d2020]/5 text-[#2d2020]/60 border-taupe'
      }`}
    >
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-wine">Posts</h1>
        <Link to="/admin/posts/new" className="btn-primary">
          New post
        </Link>
      </div>

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

      <div className="bg-white/80 border border-taupe overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-taupe">
            <tr>
              <th className="text-left p-4 font-body font-medium">Title</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Updated</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[#2d2020]/50">
                  {posts.length === 0 ? 'No posts yet.' : 'No posts match your search.'}
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id} className="border-b border-taupe/40">
                  <td className="p-4">
                    <Link to={`/admin/posts/${post.id}`} className="text-wine hover:underline font-medium">
                      {post.title}
                    </Link>
                    <p className="text-xs text-[#2d2020]/50 mt-1">/blog/{post.slug}</p>
                  </td>
                  <td className="p-4">
                    <PostStatusLabel status={post.status} />
                  </td>
                  <td className="p-4 text-[#2d2020]/60">
                    {new Date(post.updated_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {post.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => publish(post)}
                          className="text-wine text-xs font-medium hover:underline"
                        >
                          Publish
                        </button>
                      )}
                      {post.status === 'published' && post.slug && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#2d2020]/70 text-xs font-medium hover:underline"
                        >
                          View
                        </a>
                      )}
                      <Link to={`/admin/posts/${post.id}`} className="text-wine text-xs font-medium hover:underline">
                        Edit
                      </Link>
                      <button type="button" onClick={() => remove(post.id)} className="text-red-600 text-xs hover:underline">
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
