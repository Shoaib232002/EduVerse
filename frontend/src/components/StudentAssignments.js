import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments, submitAssignment, addSubmissionComment } from '../store/assignmentSlice';

const StudentAssignments = ({ classId }) => {
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state) => state.assignments);
  const { user } = useSelector((state) => state.auth);
  const [files, setFiles] = useState({});
  const [textEntries, setTextEntries] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  React.useEffect(() => {
    if (classId) {
      console.log('Fetching assignments for class:', classId);
      dispatch(fetchAssignments(classId))
        .unwrap()
        .then(result => {
          console.log('Assignments fetched successfully:', result);
        })
        .catch(error => {
          console.error('Error fetching assignments:', error);
        });
    }
  }, [classId, dispatch]);

  const handleFileChange = (id, fileList) => {
    setFiles((prev) => ({ ...prev, [id]: fileList }));
  };

  const handleTextEntryChange = (id, value) => {
    setTextEntries((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e, id) => {
    e.preventDefault();
    if (!files[id] && !textEntries[id]) return;
    dispatch(submitAssignment({ id, files: files[id], textEntry: textEntries[id] })).then(() => {
      setFiles((prev) => ({ ...prev, [id]: null }));
      setTextEntries((prev) => ({ ...prev, [id]: '' }));
      dispatch(fetchAssignments(classId));
    });
  };

  const handleCommentInput = (submissionId, value) => {
    setCommentInputs((prev) => ({ ...prev, [submissionId]: value }));
  };

  const handleAddComment = (assignmentId, submissionId) => {
    const text = commentInputs[submissionId];
    if (!text) return;
    dispatch(addSubmissionComment({ assignmentId, submissionId, text })).then(() => {
      setCommentInputs((prev) => ({ ...prev, [submissionId]: '' }));
      dispatch(fetchAssignments(classId));
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Assignments</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? <div>Loading...</div> : (
        assignments.length === 0 ? (
          <div className="text-green-600 font-bold text-center py-4">Hurray! No assignments yet</div>
        ) : (
          <ul className="space-y-4">
            {assignments.map(a => {
              // Find this student's submission if any
              const submission = a.submissions?.find(sub => sub.student === user?._id);
              return (
                <li key={a._id} className="border p-2 rounded">
                  <div className="font-bold">{a.title}</div>
                  <div className="text-sm text-gray-600">Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</div>
                  {a.topic && <div className="text-sm text-gray-500">Topic: {a.topic}</div>}
                  {a.scheduledAt && <div className="text-sm text-yellow-600">Scheduled: {new Date(a.scheduledAt).toLocaleString()}</div>}
                  {a.isDraft && <div className="text-sm text-blue-600">Draft</div>}
                  {a.attachments && a.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.attachments.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Attachment {i + 1}</a>
                      ))}
                    </div>
                  )}
                  <div className="text-gray-700 mt-1">{a.description}</div>

                  <div className="mt-2">
                    <form className="flex flex-col md:flex-row md:items-center md:space-x-2 space-y-2 md:space-y-0" onSubmit={e => handleSubmit(e, a._id)}>
                      <input type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx" onChange={e => handleFileChange(a._id, e.target.files)} />
                      <textarea
                        placeholder="Text entry (optional)"
                        value={textEntries[a._id] || ''}
                        onChange={e => handleTextEntryChange(a._id, e.target.value)}
                        className="border rounded px-2 py-1 w-full md:w-64"
                      />
                      <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading}>Submit</button>
                    </form>
                    {submission && (
                      <div className="mt-2 bg-gray-50 p-2 rounded">
                        <div className="text-green-700 font-semibold">Submitted</div>
                        {submission.files && submission.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {submission.files.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">File {i + 1}</a>
                            ))}
                          </div>
                        )}
                        {submission.textEntry && <div className="mt-1"><span className="font-semibold">Text:</span> {submission.textEntry}</div>}
                        <div className="mt-1">Status: <span className="font-semibold">{submission.status || 'submitted'}</span></div>
                        <div className="mt-1">Grade: <span className="font-semibold">{submission.grade || 'Not graded'}</span></div>
                        <div className="mt-1">Feedback: <span className="font-semibold">{submission.feedback || 'No feedback'}</span></div>
                        {/* Comments */}
                        {submission.comments && submission.comments.length > 0 && (
                          <div className="mt-2">
                            <div className="font-semibold">Comments:</div>
                            <ul className="list-disc ml-6">
                              {submission.comments.map((c, i) => (
                                <li key={i}><span className="font-semibold">{c.author === user._id ? 'You' : 'Teacher'}:</span> {c.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex items-center mt-2 space-x-2">
                          <input
                            type="text"
                            placeholder="Add a comment"
                            value={commentInputs[submission._id] || ''}
                            onChange={e => handleCommentInput(submission._id, e.target.value)}
                            className="border rounded px-2 py-1 w-full md:w-48"
                          />
                          <button
                            className="bg-blue-600 text-white px-2 py-1 rounded"
                            onClick={() => handleAddComment(a._id, submission._id)}
                            disabled={loading || !commentInputs[submission._id]}
                          >Comment</button>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
};

export default StudentAssignments;