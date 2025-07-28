import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      api.get('/api/admin/analytics'),
      api.get('/api/admin/users'),
      api.get('/api/admin/classes'),
      api.get('/api/admin/assignments'),
      api.get('/api/admin/notes'),
    ])
      .then(([a, u, c, as, n]) => {
        setAnalytics(a.data);
        setUsers(u.data.users);
        setClasses(c.data.classes);
        setAssignments(as.data.assignments);
        setNotes(n.data.notes);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load admin data');
        setLoading(false);
      });
  }, [user]);

  const handleBlockUser = (id) => {
    api.post(`/api/admin/users/${id}/block`).then(() => {
      setMsg('User status updated');
      setUsers(users => users.map(u => u._id === id ? { ...u, blocked: !u.blocked } : u));
    });
  };
  const handleDeleteUser = (id) => {
    api.delete(`/api/admin/users/${id}`).then(() => {
      setMsg('User deleted');
      setUsers(users => users.filter(u => u._id !== id));
    });
  };
  const handleDeleteClass = (id) => {
    api.delete(`/api/admin/classes/${id}`).then(() => {
      setMsg('Class deleted');
      setClasses(classes => classes.filter(c => c._id !== id));
    });
  };
  const handleDeleteAssignment = (id) => {
    api.delete(`/api/admin/assignments/${id}`).then(() => {
      setMsg('Assignment deleted');
      setAssignments(assignments => assignments.filter(a => a._id !== id));
    });
  };
  const handleDeleteNote = (id) => {
    api.delete(`/api/admin/notes/${id}`).then(() => {
      setMsg('Note deleted');
      setNotes(notes => notes.filter(n => n._id !== id));
    });
  };
  const handleRoleChange = (id, newRole) => {
    api.patch(`/api/admin/users/${id}/role`, { role: newRole }).then(res => {
      setMsg('User role updated');
      setUsers(users => users.map(u => u._id === id ? { ...u, role: newRole } : u));
    }).catch(() => {
      setMsg('Failed to update user role');
    });
  };

  if (!user || user.role !== 'admin') return <div className="p-8">Access denied.</div>;
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
  <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
    <h1 className="text-4xl font-extrabold mt-10 mb-6 text-gray-800">🛠️ Admin Dashboard</h1>

    {msg && <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded shadow">{msg}</div>}

    {/* Analytics Widgets */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-md text-center">
        <div className="text-3xl font-bold">{analytics?.counts.userCount}</div>
        <div className="mt-1 text-sm">Users</div>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-xl shadow-md text-center">
        <div className="text-3xl font-bold">{analytics?.counts.classCount}</div>
        <div className="mt-1 text-sm">Classes</div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-md text-center">
        <div className="text-3xl font-bold">{analytics?.counts.assignmentCount}</div>
        <div className="mt-1 text-sm">Assignments</div>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-md text-center">
        <div className="text-3xl font-bold">{analytics?.counts.notesCount}</div>
        <div className="mt-1 text-sm">Notes</div>
      </div>
    </div>

    {/* Reusable Table UI Component Styles */}
    <div className="space-y-12">

      {/* Users */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">👥 Users</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Blocked</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                  <td className="border p-2">{u.name}</td>
                  <td className="border p-2">{u.email}</td>
                  <td className="border p-2">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                      className="border rounded px-2 py-1"
                      disabled={u._id === user._id}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="border p-2">{u.blocked ? 'Yes' : 'No'}</td>
                  <td className="border p-2 space-x-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition"
                      onClick={() => handleBlockUser(u._id)}
                    >
                      {u.blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                      onClick={() => handleDeleteUser(u._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Classes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">🏫 Classes</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Teacher</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 transition">
                  <td className="border p-2">{c.name}</td>
                  <td className="border p-2">{c.teacher?.name || ''}</td>
                  <td className="border p-2">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                      onClick={() => handleDeleteClass(c._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Assignments */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">📚 Assignments</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Class</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a._id} className="hover:bg-gray-50 transition">
                  <td className="border p-2">{a.title}</td>
                  <td className="border p-2">{a.class?.name || ''}</td>
                  <td className="border p-2">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                      onClick={() => handleDeleteAssignment(a._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Notes */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">📝 Notes</h2>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Class</th>
                <th className="p-3 border">Uploader</th>
                <th className="p-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map(n => (
                <tr key={n._id} className="hover:bg-gray-50 transition">
                  <td className="border p-2">{n.title}</td>
                  <td className="border p-2">{n.class?.name || ''}</td>
                  <td className="border p-2">{n.uploader?.name || ''}</td>
                  <td className="border p-2">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
                      onClick={() => handleDeleteNote(n._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    {/* Recent Activity */}
    <section className="mt-12">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">📊 Recent Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-lg mb-2">Recent Users</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {analytics?.recent.users.map(u => (
              <li key={u._id}>{u.name} ({u.role})</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-lg mb-2">Recent Classes</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {analytics?.recent.classes.map(c => (
              <li key={c._id}>{c.name}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-lg mb-2">Recent Assignments</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {analytics?.recent.assignments.map(a => (
              <li key={a._id}>{a.title}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-lg mb-2">Recent Notes</h3>
          <ul className="list-disc ml-5 text-gray-700">
            {analytics?.recent.notes.map(n => (
              <li key={n._id}>{n.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  </div>
);

};

export default AdminDashboard;