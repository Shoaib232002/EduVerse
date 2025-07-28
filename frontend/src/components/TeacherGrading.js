import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments, getAssignment, addSubmissionComment } from '../store/assignmentSlice';
import api from '../services/api';

const TeacherGrading = ({ classId }) => {
  const dispatch = useDispatch();
  const { assignments, current, loading, error } = useSelector((state) => state.assignments);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [grading, setGrading] = useState({});
  const [msg, setMsg] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  React.useEffect(() => {
    if (classId) dispatch(fetchAssignments(classId));
  }, [classId, dispatch]);

  const handleSelect = (id) => {
    setSelectedAssignment(id);
    dispatch(getAssignment(id));
  };

  const handleChange = (studentId, field, value) => {
    setGrading((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleGrade = async (studentId) => {
    if (!selectedAssignment) return;
    const { grade, feedback } = grading[studentId] || {};
    try {
      await api.post(`/assignment/${selectedAssignment}/grade`, { studentId, grade, feedback });
      setMsg('Graded successfully!');
      dispatch(getAssignment(selectedAssignment));
    } catch (err) {
      setMsg('Failed to grade');
    }
  };

  const handleCommentInput = (submissionId, value) => {
    setCommentInputs((prev) => ({ ...prev, [submissionId]: value }));
  };

  const handleAddComment = (assignmentId, submissionId) => {
    const text = commentInputs[submissionId];
    if (!text) return;
    dispatch(addSubmissionComment({ assignmentId, submissionId, text })).then(() => {
      setCommentInputs((prev) => ({ ...prev, [submissionId]: '' }));
      dispatch(getAssignment(assignmentId));
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Grade Assignments</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="mb-4">
        <label className="block mb-1">Select Assignment:</label>
        <select className="w-full border rounded px-2 py-1" value={selectedAssignment || ''} onChange={e => handleSelect(e.target.value)}>
          <option value="">-- Select --</option>
          {assignments.map(a => (
            <option key={a._id} value={a._id}>{a.title}</option>
          ))}
        </select>
      </div>
      {loading && <div>Loading...</div>}
      {msg && <div className="mb-2 text-green-600">{msg}</div>}
      {current && (
        <div className="mb-4">
          {current.topic && <div className="text-sm text-gray-500">Topic: {current.topic}</div>}
          {current.scheduledAt && <div className="text-sm text-yellow-600">Scheduled: {new Date(current.scheduledAt).toLocaleString()}</div>}
          {current.isDraft && <div className="text-sm text-blue-600">Draft</div>}
          {current.attachments && current.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {current.attachments.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {i + 1}</a>
              ))}
            </div>
          )}
          <div className="text-gray-700 mt-1">{current.description}</div>
          {current.rubric && current.rubric.length > 0 && (
            <div className="mt-1">
              <div className="font-semibold">Rubric:</div>
              <ul className="list-disc ml-6">
                {current.rubric.map((r, i) => (
                  <li key={i}>{r.criterion} ({r.maxPoints} pts)</li>
                ))}
              </ul>
            </div>
          )}
          {assignment.rubric && assignment.rubric.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Rubric</h3>
              <table className="min-w-full border">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Criterion</th>
                    <th className="border px-2 py-1">Max Points</th>
                    <th className="border px-2 py-1">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {assignment.rubric.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{item.criterion}</td>
                      <td className="border px-2 py-1">{item.maxPoints}</td>
                      <td className="border px-2 py-1">
                        <input type="number" min="0" max={item.maxPoints} className="w-16 border rounded px-1" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {current && current.submissions && current.submissions.length > 0 ? (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Student</th>
              <th className="p-2 border">Files</th>
              <th className="p-2 border">Text Entry</th>
              <th className="p-2 border">Submitted At</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Grade</th>
              <th className="p-2 border">Feedback</th>
              <th className="p-2 border">Comments</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {current.submissions.map(sub => (
              <tr key={sub._id || sub.student}>
                <td className="border p-2">{sub.student}</td>
                <td className="border p-2">
                  {sub.files && sub.files.length > 0 ? sub.files.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">File {i + 1}</a>
                  )) : '—'}
                </td>
                <td className="border p-2">{sub.textEntry || '—'}</td>
                <td className="border p-2">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}</td>
                <td className="border p-2">{sub.status || 'submitted'}</td>
                <td className="border p-2">
                  <input type="text" className="border rounded px-2 py-1 w-20" value={grading[sub.student]?.grade || sub.grade || ''} onChange={e => handleChange(sub.student, 'grade', e.target.value)} />
                </td>
                <td className="border p-2">
                  <input type="text" className="border rounded px-2 py-1 w-32" value={grading[sub.student]?.feedback || sub.feedback || ''} onChange={e => handleChange(sub.student, 'feedback', e.target.value)} />
                </td>
                <td className="border p-2">
                  {sub.comments && sub.comments.length > 0 && (
                    <ul className="list-disc ml-2">
                      {sub.comments.map((c, i) => (
                        <li key={i}><span className="font-semibold">{c.author === 'teacher' ? 'You' : 'Student'}:</span> {c.text}</li>
                      ))}
                    </ul>
                  )}
                  <div className="flex items-center mt-1 space-x-2">
                    <input
                      type="text"
                      placeholder="Add comment"
                      value={commentInputs[sub._id] || ''}
                      onChange={e => handleCommentInput(sub._id, e.target.value)}
                      className="border rounded px-2 py-1 w-32"
                    />
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                      onClick={() => handleAddComment(current._id, sub._id)}
                      disabled={loading || !commentInputs[sub._id]}
                    >Comment</button>
                  </div>
                </td>
                <td className="border p-2">
                  <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleGrade(sub.student)}>Save</button>
                  {/* Optionally: Add return/revision button here if backend supports */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : selectedAssignment && <div className="text-gray-500">No submissions yet.</div>}
    </div>
  );
};

export default TeacherGrading;