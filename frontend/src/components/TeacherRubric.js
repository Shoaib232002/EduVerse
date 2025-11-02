import React, { useState } from 'react';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const TeacherRubric = ({ classId }) => {
  const [rubrics, setRubrics] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    criteria: [{ description: '', maxPoints: 0 }]
  });

  const addCriteria = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { description: '', maxPoints: 0 }]
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement rubric creation
    setRubrics([...rubrics, { ...formData, id: Date.now() }]);
    setFormData({ title: '', criteria: [{ description: '', maxPoints: 0 }] });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Rubrics</h2>
      <div className="space-y-6">
        {/* Rubric List */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">Available Rubrics</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> Create Rubric
          </button>
        </div>

        <div className="space-y-4">
          {rubrics.map((rubric) => (
            <div key={rubric.id} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-lg">{rubric.title}</h4>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <FaEdit />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="divide-y">
                {rubric.criteria.map((criterion, index) => (
                  <div key={index} className="py-2">
                    <div className="flex justify-between">
                      <span>{criterion.description}</span>
                      <span className="font-medium">{criterion.maxPoints} points</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Create Rubric Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
              <h3 className="text-xl font-semibold mb-4">Create New Rubric</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rubric Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criteria
                  </label>
                  {formData.criteria.map((criterion, index) => (
                    <div key={index} className="flex gap-4 mb-2">
                      <input
                        type="text"
                        value={criterion.description}
                        onChange={(e) => {
                          const newCriteria = [...formData.criteria];
                          newCriteria[index].description = e.target.value;
                          setFormData({ ...formData, criteria: newCriteria });
                        }}
                        className="flex-grow p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Criterion description"
                        required
                      />
                      <input
                        type="number"
                        value={criterion.maxPoints}
                        onChange={(e) => {
                          const newCriteria = [...formData.criteria];
                          newCriteria[index].maxPoints = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, criteria: newCriteria });
                        }}
                        className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Points"
                        required
                        min="0"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCriteria}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add criterion
                  </button>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create Rubric
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {rubrics.length === 0 && !showForm && (
          <div className="text-center py-8 text-gray-500">
            <p>No rubrics created yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Create your first rubric
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherRubric;
