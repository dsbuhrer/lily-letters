import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.admin.posts().then((r) => setPosts(r.posts || [])).catch(console.error);
  }, []);

  const remove = async (id) => {
    if (!confirm('Delete this post?')) return;
    await api.admin.deletePost(id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-wine">Posts</h1>
        <Link to="/admin/posts/new" className="btn-primary">
          New post
        </Link>
      </div>
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
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-taupe/40">
                <td className="p-4">
                  <Link to={`/admin/posts/${post.id}`} className="text-wine hover:underline font-medium">
                    {post.title}
                  </Link>
                  <p className="text-xs text-[#2d2020]/50 mt-1">/blog/{post.slug}</p>
                </td>
                <td className="p-4 capitalize">{post.status}</td>
                <td className="p-4 text-[#2d2020]/60">
                  {new Date(post.updated_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <button type="button" onClick={() => remove(post.id)} className="text-red-600 text-xs hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
