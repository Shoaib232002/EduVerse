import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssignments } from '../store/assignmentSlice';
import api from '../services/api';

const TeacherGrading = ({ classId }) => {
  const dispatch = useDispatch();
  const { assignments = [], loading = false } = useSelector((state) => state.assignments || {});
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [gradingData, setGradingData] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (classId) {
      setError(null);
      dispatch(fetchAssignments(classId)).catch(err => {
        console.error('Failed to fetch assignments:', err);
        setError('Failed to load assignments');
      });
    }
  }, [classId, dispatch]);

  const handleGradeChange = (submissionId, field, value) => {
    // Convert grade to number if it's the grade field
    const processedValue = field === 'grade' && value !== '' ? Number(value) : value;
    setGradingData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: processedValue
      }
    }));
  };

  const handleSubmitGrade = async (assignmentId, submissionId) => {
    try {
      const gradeData = gradingData[submissionId];
      if (!gradeData || !gradeData.grade) {
        alert('Please enter a grade');
        return;
      }

      const response = await api.post(`/assignments/${assignmentId}/grade`, {
        submissionId: submissionId,
        grade: gradeData.grade,
        feedback: gradeData.feedback || ''
      });

      if (response.data.assignment) {
        // Update the assignments in the store with the newly populated data
        const updatedAssignments = assignments.map(a => 
          a._id === assignmentId ? response.data.assignment : a
        );
        dispatch({ type: 'assignments/fetchAssignments/fulfilled', payload: updatedAssignments });
      } else {
        // Fallback to fetching all assignments
        dispatch(fetchAssignments(classId));
      }
      alert('Grade submitted successfully');
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Failed to submit grade');
    }
  };

  useEffect(() => {
    // Clear grading data when switching assignments
    setGradingData({});
  }, [selectedAssignment]);

  if (loading) {
    return React.createElement('div', { 
      className: 'text-center py-4 text-gray-600 animate-pulse' 
    }, 'Loading assignments...');
  }

  if (error) {
    return React.createElement('div', { 
      className: 'text-center py-4 text-red-600' 
    }, `Error: ${error}`);
  }

  const renderSubmission = (submission, assignmentId) => {
    const statusClass = submission.status === 'graded' ? 'bg-green-100 text-green-800' :
                       submission.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                       'bg-gray-100 text-gray-800';

    return React.createElement('div', {
      key: submission._id,
      className: 'border-l-4 border-blue-200 pl-4 py-2 bg-gray-50 rounded'
    }, [
      React.createElement('div', {
        key: 'submission-content',
        className: 'flex justify-between items-start'
      }, [
        React.createElement('div', {
          key: 'submission-info',
          className: 'flex-1'
        }, [
          React.createElement('div', {
            key: 'student-info',
            className: 'space-y-1'
          }, [
            React.createElement('p', {
              key: 'student-name',
              className: 'font-medium text-gray-800'
            }, `Student: ${submission.student?.name || 'Loading...'}`,
              React.createElement('span', {
                key: 'student-email',
                className: 'ml-2 text-sm text-gray-600'
              }, submission.student?.email ? `(${submission.student.email})` : '')
            ),
          ]),
          
          React.createElement('p', {
            key: 'submitted-date',
            className: 'text-sm text-gray-600'
          }, `Submitted: ${submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Unknown'}`),
          
          React.createElement('p', {
            key: 'status',
            className: 'text-sm text-gray-600'
          }, [
            'Status: ',
            React.createElement('span', {
              key: 'status-badge',
              className: `px-2 py-1 rounded text-xs ${statusClass}`
            }, submission.status || 'submitted')
          ]),
          
          submission.textEntry && React.createElement('div', {
            key: 'text-entry',
            className: 'mt-2 p-2 bg-white rounded border'
          }, [
            React.createElement('p', {
              key: 'text-entry-label',
              className: 'text-sm font-medium text-gray-700'
            }, 'Text Entry:'),
            React.createElement('p', {
              key: 'text-entry-content',
              className: 'text-sm text-gray-600 whitespace-pre-wrap'
            }, submission.textEntry)
          ]),
          
          submission.files && submission.files.length > 0 && React.createElement('div', {
            key: 'files',
            className: 'mt-2'
          }, [
            React.createElement('p', {
              key: 'files-label',
              className: 'text-sm font-medium text-gray-700'
            }, 'Files:'),
            React.createElement('div', {
              key: 'files-list',
              className: 'flex flex-wrap gap-2 mt-1'
            }, submission.files.map((file, index) => 
              React.createElement('a', {
                key: index,
                href: file,
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'text-blue-600 hover:text-blue-800 underline text-sm'
              }, `File ${index + 1}`)
            ))
          ]),
          
          submission.grade && React.createElement('div', {
            key: 'grade-display',
            className: 'mt-2 p-2 bg-green-50 rounded border'
          }, [
            React.createElement('p', {
              key: 'grade-text',
              className: 'text-sm font-medium text-green-800'
            }, `Grade: ${submission.grade}`),
            submission.feedback && React.createElement('p', {
              key: 'feedback-text',
              className: 'text-sm text-green-700 mt-1'
            }, submission.feedback)
          ])
        ]),
        
        React.createElement('div', {
          key: 'grading-form',
          className: 'ml-4 space-y-2'
        }, [
          React.createElement('div', {
            key: 'grade-input'
          }, [
            React.createElement('label', {
              key: 'grade-label',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Grade'),
            React.createElement('input', {
              key: 'grade-field',
              type: 'number',
              min: '0',
              max: '100',
              value: gradingData[submission._id]?.grade || submission.grade || '',
              onChange: (e) => handleGradeChange(submission._id, 'grade', e.target.value),
              className: 'w-20 px-2 py-1 border rounded text-sm',
              placeholder: 'Enter marks'
            })
          ]),
          
          React.createElement('div', {
            key: 'feedback-input'
          }, [
            React.createElement('label', {
              key: 'feedback-label',
              className: 'block text-sm font-medium text-gray-700 mb-1'
            }, 'Feedback'),
            React.createElement('textarea', {
              key: 'feedback-field',
              value: gradingData[submission._id]?.feedback || submission.feedback || '',
              onChange: (e) => handleGradeChange(submission._id, 'feedback', e.target.value),
              className: 'w-48 px-2 py-1 border rounded text-sm',
              rows: 2,
              placeholder: 'Add feedback...'
            })
          ]),
          
          React.createElement('button', {
            key: 'submit-button',
            onClick: () => handleSubmitGrade(assignmentId, submission._id),
            className: 'w-full px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm'
          }, 'Submit Grade')
        ])
      ])
    ]);
  };

  const renderAssignment = (assignment) => {
    return React.createElement('div', {
      key: assignment._id,
      className: 'border rounded-lg p-4 bg-white shadow-sm'
    }, [
      React.createElement('div', {
        key: 'assignment-header',
        className: 'flex justify-between items-start mb-4'
      }, [
        React.createElement('div', {
          key: 'assignment-info'
        }, [
          React.createElement('h3', {
            key: 'assignment-title',
            className: 'text-lg font-semibold text-gray-800'
          }, assignment.title),
          
          React.createElement('p', {
            key: 'due-date',
            className: 'text-sm text-gray-600'
          }, `Due: ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}`),
          
          assignment.description && React.createElement('p', {
            key: 'description',
            className: 'text-sm text-gray-700 mt-1'
          }, assignment.description)
        ]),
        
        React.createElement('button', {
          key: 'toggle-button',
          onClick: () => setSelectedAssignment(selectedAssignment === assignment._id ? null : assignment._id),
          className: 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
        }, selectedAssignment === assignment._id ? 'Hide Submissions' : 'View Submissions')
      ]),
      
      selectedAssignment === assignment._id && React.createElement('div', {
        key: 'submissions',
        className: 'mt-4 space-y-3'
      }, assignment.submissions && assignment.submissions.length > 0 ? 
        assignment.submissions.map(submission => renderSubmission(submission, assignment._id)) :
        React.createElement('div', {
          key: 'no-submissions',
          className: 'text-center py-4 text-gray-500'
        }, 'No submissions yet for this assignment.')
      )
    ]);
  };

  return React.createElement('div', { className: 'space-y-6' }, [
    React.createElement('h2', {
      key: 'title',
      className: 'text-2xl font-semibold text-gray-800'
    }, 'Grading'),
    
    assignments.length === 0 ? 
      React.createElement('div', {
        key: 'no-assignments',
        className: 'text-center py-8 text-gray-500'
      }, 'No assignments found for this class.') :
      React.createElement('div', {
        key: 'assignments-list',
        className: 'space-y-4'
      }, assignments.map(renderAssignment))
  ]);
};

export default TeacherGrading;
