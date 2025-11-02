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
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      // Load data sequentially for better error tracking
      console.log('Starting to load admin data...');
      
      try {
        console.log('Loading analytics...');
        const analyticsRes = await api.get('/admin/analytics');
        setAnalytics(analyticsRes.data || { counts: {}, recent: {} });
      } catch (err) {
        console.error('Analytics error:', err);
        throw new Error('Failed to load analytics data');
      }

      try {
        console.log('Loading users...');
        const usersRes = await api.get('/admin/users');
        setUsers(usersRes.data?.users || []);
      } catch (err) {
        console.error('Users error:', err);
        throw new Error('Failed to load users data');
      }

      try {
        console.log('Loading classes...');
        const classesRes = await api.get('/admin/classes');
        setClasses(classesRes.data?.classes || []);
      } catch (err) {
        console.error('Classes error:', err);
        throw new Error('Failed to load classes data');
      }

      try {
        console.log('Loading assignments...');
        const assignmentsRes = await api.get('/admin/assignments');
        setAssignments(assignmentsRes.data?.assignments || []);
      } catch (err) {
        console.error('Assignments error:', err);
        throw new Error('Failed to load assignments data');
      }

      try {
        console.log('Loading notes...');
        const notesRes = await api.get('/admin/notes');
        setNotes(notesRes.data?.notes || []);
      } catch (err) {
        console.error('Notes error:', err);
        throw new Error('Failed to load notes data');
      }

      try {
        console.log('Loading announcements...');
        const announcementsRes = await api.get('/admin/announcements');
        setAnnouncements(announcementsRes.data?.announcements || []);
      } catch (err) {
        console.error('Announcements error:', err);
        throw new Error('Failed to load announcements data');
      }

    } catch (err) {
      console.error('Error in loadAdminData:', err);
      setError(err.message || 'Failed to load admin data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (id) => {
    if (!window.confirm('Are you sure you want to ' + (users.find(u => u._id === id)?.blocked ? 'unblock' : 'block') + ' this user?')) {
      return;
    }
    try {
      const response = await api.post(`/admin/users/${id}/block`);
      
      if (response.data?.user) {
        setUsers(users => users.map(u => u._id === id ? { ...u, ...response.data.user } : u));
        setMsg(response.data?.message || 'User status updated successfully');
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('Error blocking user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update user status';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/users/${id}`);
      setMsg(response.data?.message || 'User deleted successfully');
      setUsers(users => users.filter(u => u._id !== id));
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete user';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/classes/${id}`);
      setMsg(response.data?.message || 'Class deleted successfully');
      setClasses(classes => classes.filter(c => c._id !== id));
    } catch (err) {
      console.error('Error deleting class:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete class';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/assignments/${id}`);
      setMsg(response.data?.message || 'Assignment deleted successfully');
      setAssignments(assignments => assignments.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error deleting assignment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete assignment';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/notes/${id}`);
      setMsg(response.data?.message || 'Note deleted successfully');
      setNotes(notes => notes.filter(n => n._id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete note';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await api.delete(`/admin/announcements/${id}`);
      setMsg(response.data?.message || 'Announcement deleted successfully');
      setAnnouncements(announcements => announcements.filter(a => a._id !== id));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete announcement';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      const response = await api.patch(`/admin/users/${id}/role`, { role: newRole });
      setMsg(response.data?.message || 'User role updated successfully');
      
      // Update the user in the state with all returned data
      if (response.data?.user) {
        setUsers(users => users.map(u => u._id === id ? { ...u, ...response.data.user } : u));
      } else {
        setUsers(users => users.map(u => u._id === id ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update user role';
      setMsg(`Error: ${errorMessage}`);
    }
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Clear message after 3 seconds
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-xl">Access Denied</div>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-xl mb-4">Error Loading Data</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={loadAdminData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
  <div className="p-6 md:p-10 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold text-gray-800 mt-10">🛠️ Admin Dashboard</h1>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-2 bg-green-100 text-green-700 rounded shadow animate-pulse">
          {msg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'classes', name: 'Classes', icon: '🏫' },
              { id: 'assignments', name: 'Assignments', icon: '📚' },
              { id: 'notes', name: 'Notes', icon: '📝' },
              { id: 'announcements', name: 'Announcements', icon: '📢' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
    {/* Analytics Widgets */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-xl shadow-md text-center">
              <div className="text-3xl font-bold">{analytics?.counts?.userCount || 0}</div>
        <div className="mt-1 text-sm">Users</div>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-xl shadow-md text-center">
              <div className="text-3xl font-bold">{analytics?.counts?.classCount || 0}</div>
        <div className="mt-1 text-sm">Classes</div>
      </div>
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-md text-center">
              <div className="text-3xl font-bold">{analytics?.counts?.assignmentCount || 0}</div>
        <div className="mt-1 text-sm">Assignments</div>
      </div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-6 rounded-xl shadow-md text-center">
              <div className="text-3xl font-bold">{analytics?.counts?.notesCount || 0}</div>
        <div className="mt-1 text-sm">Notes</div>
      </div>
      <div className="bg-gradient-to-r from-pink-500 to-pink-700 text-white p-6 rounded-xl shadow-md text-center">
              <div className="text-3xl font-bold">{analytics?.counts?.announcementCount || 0}</div>
        <div className="mt-1 text-sm">Announcements</div>
      </div>
    </div>

    
          {/* Recent Activity */}
          <section className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">📊 Recent Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-2">Recent Users</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {analytics?.recent?.users?.map(u => (
                    <li key={u._id}>{u.name} ({u.role})</li>
                  )) || <li>No recent users</li>}
                </ul>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-2">Recent Classes</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {analytics?.recent?.classes?.map(c => (
                    <li key={c._id}>{c.name}</li>
                  )) || <li>No recent classes</li>}
                </ul>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-2">Recent Assignments</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {analytics?.recent?.assignments?.map(a => (
                    <li key={a._id}>{a.title}</li>
                  )) || <li>No recent assignments</li>}
                </ul>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-2">Recent Notes</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {analytics?.recent?.notes?.map(n => (
                    <li key={n._id}>{n.title}</li>
                  )) || <li>No recent notes</li>}
                </ul>
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold text-lg mb-2">Recent Announcements</h3>
                <ul className="list-disc ml-5 text-gray-700">
                  {analytics?.recent?.announcements?.map(a => (
                    <li key={a._id}>{a.title} - {a.class?.name}</li>
                  )) || <li>No recent announcements</li>}
                </ul>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
      <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">👥 Users Management</h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-2 w-64"
              />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100">
              <tr>
                    <th className="p-3 border text-left">Name</th>
                    <th className="p-3 border text-left">Email</th>
                    <th className="p-3 border text-left">Role</th>
                    <th className="p-3 border text-left">Status</th>
                    <th className="p-3 border text-left">Joined</th>
                    <th className="p-3 border text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No users found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition">
                        <td className="border p-3 font-medium">{u.name}</td>
                        <td className="border p-3 text-gray-600">{u.email}</td>
                        <td className="border p-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u._id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                      disabled={u._id === user._id}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                        <td className="border p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            u.blocked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {u.blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="border p-3 text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-3">
                          <div className="flex space-x-2">
                    <button
                              className={`px-3 py-1 rounded text-sm transition ${
                                u.blocked
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                              }`}
                      onClick={() => handleBlockUser(u._id)}
                              disabled={u._id === user._id}
                    >
                      {u.blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                      onClick={() => handleDeleteUser(u._id)}
                              disabled={u._id === user._id}
                    >
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
      </section>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">🏫 Classes Management</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Name</th>
                    <th className="p-3 border text-left">Teacher</th>
                    <th className="p-3 border text-left">Students</th>
                    <th className="p-3 border text-left">Created</th>
                    <th className="p-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No classes found
                      </td>
                    </tr>
                  ) : (
                    classes.map(c => (
                      <React.Fragment key={c._id}>
                        <tr className="hover:bg-gray-50 transition">
                          <td className="border p-3">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  const elem = document.getElementById(`class-details-${c._id}`);
                                  if (elem) {
                                    elem.style.display = elem.style.display === 'none' ? 'table-row' : 'none';
                                  }
                                }}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <span className="font-medium">{c.name}</span>
                            </div>
                          </td>
                          <td className="border p-3 text-gray-600">{c.teacher?.name || 'N/A'}</td>
                          <td className="border p-3 text-gray-600">{c.students?.length || 0}</td>
                          <td className="border p-3 text-sm text-gray-500">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="border p-3">
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                              onClick={() => handleDeleteClass(c._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                        <tr id={`class-details-${c._id}`} style={{ display: 'none' }}>
                          <td colSpan="5" className="border p-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* Students Section */}
                              <div>
                                <h3 className="font-semibold text-gray-700 mb-2">📚 Enrolled Students:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {c.students && c.students.length > 0 ? (
                                    c.students.map(student => (
                                      <div key={student._id} className="bg-white p-2 rounded border flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span>{student.name || student.email}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-500 italic">No students enrolled</p>
                                  )}
                                </div>
                              </div>

                              {/* Assignments Section */}
                              <div>
                                <h3 className="font-semibold text-gray-700 mb-2">📝 Assignments:</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {assignments.filter(a => a.class?._id === c._id).length > 0 ? (
                                    assignments
                                      .filter(a => a.class?._id === c._id)
                                      .map(assignment => (
                                        <div key={assignment._id} className="bg-white p-2 rounded border flex justify-between items-center">
                                          <div>
                                            <span className="font-medium">{assignment.title}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                              Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <p className="text-gray-500 italic">No assignments</p>
                                  )}
                                </div>
                              </div>

                              {/* Notes Section */}
                              <div>
                                <h3 className="font-semibold text-gray-700 mb-2">📋 Notes:</h3>
                                <div className="grid grid-cols-1 gap-2">
                                  {notes.filter(n => n.class?._id === c._id).length > 0 ? (
                                    notes
                                      .filter(n => n.class?._id === c._id)
                                      .map(note => (
                                        <div key={note._id} className="bg-white p-2 rounded border flex justify-between items-center">
                                          <div>
                                            <span className="font-medium">{note.title}</span>
                                            <span className="text-sm text-gray-500 ml-2">
                                              By: {note.uploader?.name || 'Unknown'}
                                            </span>
                                          </div>
                                        </div>
                                      ))
                                  ) : (
                                    <p className="text-gray-500 italic">No notes</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">📚 Assignments Management</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Title</th>
                    <th className="p-3 border text-left">Class</th>
                    <th className="p-3 border text-left">Due Date</th>
                    <th className="p-3 border text-left">Created</th>
                    <th className="p-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No assignments found
                      </td>
                    </tr>
                  ) : (
                    assignments.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50 transition">
                        <td className="border p-3 font-medium">{a.title}</td>
                        <td className="border p-3 text-gray-600">{a.class?.name || 'N/A'}</td>
                        <td className="border p-3 text-gray-600">
                          {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="border p-3 text-sm text-gray-500">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-3">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                            onClick={() => handleDeleteAssignment(a._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">📝 Notes Management</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Title</th>
                    <th className="p-3 border text-left">Class</th>
                    <th className="p-3 border text-left">Uploader</th>
                    <th className="p-3 border text-left">Type</th>
                    <th className="p-3 border text-left">Created</th>
                    <th className="p-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No notes found
                      </td>
                    </tr>
                  ) : (
                    notes.map(n => (
                      <tr key={n._id} className="hover:bg-gray-50 transition">
                        <td className="border p-3 font-medium">{n.title}</td>
                        <td className="border p-3 text-gray-600">{n.class?.name || 'N/A'}</td>
                        <td className="border p-3 text-gray-600">{n.uploader?.name || 'N/A'}</td>
                        <td className="border p-3 text-gray-600">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {n.type || 'Document'}
                          </span>
                        </td>
                        <td className="border p-3 text-sm text-gray-500">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-3">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                            onClick={() => handleDeleteNote(n._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">📢 Announcements Management</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Title</th>
                    <th className="p-3 border text-left">Content</th>
                    <th className="p-3 border text-left">Class</th>
                    <th className="p-3 border text-left">Author</th>
                    <th className="p-3 border text-left">Created</th>
                    <th className="p-3 border text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No announcements found
                      </td>
                    </tr>
                  ) : (
                    announcements.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50 transition">
                        <td className="border p-3 font-medium">{a.title}</td>
                        <td className="border p-3 text-gray-600">
                          <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {a.content}
                          </div>
                        </td>
                        <td className="border p-3 text-gray-600">{a.class?.name || 'N/A'}</td>
                        <td className="border p-3 text-gray-600">{a.author?.name || 'N/A'}</td>
                        <td className="border p-3 text-sm text-gray-500">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border p-3">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition"
                            onClick={() => handleDeleteAnnouncement(a._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
);

};

export default AdminDashboard;