import React from 'react';
import { useSelector } from 'react-redux';

/**
 * A wrapper component that renders either the teacher or student version of a component
 * based on the user's role in the class.
 * 
 * @param {Object} props
 * @param {React.Component} props.TeacherComponent - The component to render for teachers
 * @param {React.Component} props.StudentComponent - The component to render for students
 * @param {string} props.classId - The ID of the current class
 */
const ClassComponentWrapper = ({ TeacherComponent, StudentComponent, classId, ...props }) => {
  const { current: classData } = useSelector((state) => state.classes);
  const { user } = useSelector((state) => state.auth);

  // Determine if the current user is a teacher for this class
  const isTeacher = classData?.isTeacher || 
                   (classData?.teacher?._id === user?._id) || 
                   (classData?.teacher === user?._id);

  if (isTeacher) {
    return <TeacherComponent classId={classId} {...props} />;
  }

  return <StudentComponent classId={classId} {...props} />;
};

export default ClassComponentWrapper;
