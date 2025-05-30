import React, { useEffect, useState } from 'react';
import { Supabase } from "../config/supabase-config";
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

const StaffProjects = () => {
//   const [data, setData] = useState({});
//   const [openUser, setOpenUser] = useState(null);
//   const [openProject, setOpenProject] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [isNewProject, setIsNewProject] = useState(false);
// const userProjects = Object.keys(data[username] || {});


//   const loggedInUser = JSON.parse(localStorage.getItem("ganttUser")) || {};
//   const username = loggedInUser.username || "";
//   const userId = loggedInUser.user_id || "";

//   const [form, setForm] = useState({
//     username,
//     username_id: userId,
//     project: '',
//     task: '',
//     checked:'false'
//   });

//   const fetchData = async () => {
//     const { data: rows, error } = await Supabase.from('staffs-projects').select('*');
//     if (error) {
//       console.error('Error fetching data:', error);
//       return;
//     }
  
//     const groupedData = rows.reduce((acc, row) => {
//       if (!acc[row.username]) acc[row.username] = {};
//       if (!acc[row.username][row.project]) acc[row.username][row.project] = [];
//       acc[row.username][row.project].push(row); // Push full row, not just task name
//       return acc;
//     }, {});
  
//     setData(groupedData);
//   };
  

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const toggleUser = (username) => {
//     setOpenUser(openUser === username ? null : username);
//     setOpenProject(null);
//   };

//   const toggleProject = (project) => {
//     setOpenProject(openProject === project ? null : project);
//   };

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
  
//     if (form.taskId) {
//       // Editing existing task
//       const { error } = await Supabase
//         .from('staffs-projects')
//         .update({
//           task: form.task,
//           project: form.project,
//         })
//         .eq('id', form.taskId);
  
//       if (error) {
//         alert('Error updating task: ' + error.message);
//       }
//     } else {
//       // Creating new task
//       const { error } = await Supabase
//         .from('staffs-projects')
//         .insert([form]);
  
//       if (error) {
//         alert('Error adding task: ' + error.message);
//       }
//     }
  
//     setShowModal(false);
//     setForm({ username, username_id: userId, project: '', task: '', taskId: null });
//     fetchData();
//   };
  

//   const handleCheckboxChange = async (taskId, isChecked) => {
//     const { error } = await Supabase
//       .from('staffs-projects')
//       .update({ checked: isChecked })
//       .eq('id', taskId);
  
//     if (error) {
//       console.error('Failed to update task status:', error);
//     } else {
//       fetchData(); // Refresh state
//     }
//   };

//   const calculateProgress = (tasks) => {
//     const total = tasks.length;
//     const completed = tasks.filter(t => t.checked === true || t.checked === 'true').length;
//     return total > 0 ? Math.round((completed / total) * 100) : 0;
//   };
  

  return (
    <div className="staff-container">
      {/* <div className="staff-title-bar">
        <h1>Staffs Personal Projects</h1>
        <button onClick={() => setShowModal(true)} className="button-add">
          <Plus size={16} />
          Add
        </button>
      </div>

      {Object.keys(data).length === 0 ? (
        <p className="empty-message">No staff projects found.</p>
      ) : (
        Object.entries(data).map(([username, projects]) => (
          <div key={username} className="user-block">
            <button
              onClick={() => toggleUser(username)}
              className="collapsible-header"
              aria-expanded={openUser === username}
            >
              <span>{username}</span>
              {openUser === username ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {openUser === username && (
              <div className="user-projects">
                {Object.entries(projects).map(([project, tasks]) => (
                  <div key={project} className="project-block">
                    <button
                      onClick={() => toggleProject(project)}
                      className="project-header"
                      aria-expanded={openProject === project}
                    >
                      <span>{project}</span>
                      {openProject === project ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    {openProject === project && (
                      <ul className="task-list">
                        {tasks.map((taskObj, idx) => (
                        <li key={idx} className="task-item">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                checked={taskObj.checked === true || taskObj.checked === 'true'}
                                onChange={(e) => handleCheckboxChange(taskObj.id, e.target.checked)}
                            />
                            {taskObj.task}
                            <button
                            onClick={() => {
                                setForm({
                                ...form,
                                username: taskObj.username,
                                username_id: taskObj.username_id,
                                project: taskObj.project,
                                task: taskObj.task,
                                taskId: taskObj.id, // Add this field to differentiate edit vs add
                                });
                                setShowModal(true);
                            }}
                            >
                            ✏️ Edit
                            </button>

                            </label>
                        </li>
                        ))}
                        <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div
                            className="progress-fill"
                            style={{ width: `${calculateProgress(tasks)}%` }}
                            />
                        </div>
                        <small>{calculateProgress(tasks)}% Complete</small>
                        </div>

                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button
              onClick={() => setShowModal(false)}
              className="modal-close"
              aria-label="Close modal"
            >
              <X />
            </button>
            <h2 id="modal-title" style={{ marginBottom: '1rem' }}>Add Staff Project</h2>
            <form onSubmit={handleSubmit}>
            <label>
                <input
                    type="checkbox"
                    checked={isNewProject}
                    onChange={(e) => setIsNewProject(e.target.checked)}
                />
                Create new project?
                </label>

                {isNewProject ? (
                <input
                    type="text"
                    name="project"
                    placeholder="New Project Title"
                    value={form.project}
                    onChange={handleChange}
                    required
                />
                ) : (
                <select
                    name="project"
                    value={form.project}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a project</option>
                    {userProjects.map((proj) => (
                    <option key={proj} value={proj}>{proj}</option>
                    ))}
                </select>
                )}

              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default StaffProjects;
