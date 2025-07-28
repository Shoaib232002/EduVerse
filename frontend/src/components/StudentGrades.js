import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments } from '../store/assignmentSlice';
import { useSelector as useAuthSelector } from 'react-redux';

const StudentGrades = ({ classId }) => {
  const dispatch = useDispatch();
  const { assignments, loading, error } = useSelector((state) => state.assignments);
  const { user } = useAuthSelector((state) => state.auth);

  React.useEffect(() => {
    if (classId) dispatch(fetchAssignments(classId));
  }, [classId, dispatch]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Your Assignment Grades</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading ? <div>Loading...</div> : (
        <ul className="space-y-2">
          {assignments.map(a => {
            const submission = a.submissions?.find(sub => 
              (typeof sub.student === 'object' ? sub.student._id : sub.student) === user?._id
            );
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
                {a.rubric && a.rubric.length > 0 && (
                  <div className="mt-1">
                    <div className="font-semibold">Rubric:</div>
                    <ul className="list-disc ml-6">
                      {a.rubric.map((r, i) => (
                        <li key={i}>{r.criterion} ({r.maxPoints} pts)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {submission ? (
                  <div className="mt-2 bg-gray-50 p-2 rounded">
                    <div>Status: <span className="text-green-700">{submission.status || 'Submitted'}</span></div>
                    <div>Grade: <span className="font-semibold">{submission.grade || 'Not graded'}</span></div>
                    <div>Feedback: <span className="font-semibold">{submission.feedback || 'No feedback'}</span></div>
                    {submission.files && submission.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {submission.files.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">File {i + 1}</a>
                        ))}
                      </div>
                    )}
                    {submission.textEntry && <div className="mt-1"><span className="font-semibold">Text:</span> {submission.textEntry}</div>}
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
                  </div>
                ) : (
                  <div className="mt-2 text-red-600">Not submitted</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default StudentGrades; 