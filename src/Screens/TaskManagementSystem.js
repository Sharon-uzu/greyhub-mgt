import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Check, User, Clock, BarChart3, CheckCircle2, Circle } from 'lucide-react';
import { Supabase } from "../config/supabase-config";

// Mock user data - replace with actual authentication
const MOCK_USER = {
  id: 'user_123',
  username: 'john_doe'
};

// Mock Supabase functions - replace with actual Supabase client
const mockSupabase = {
  projects: [
    { id: 'proj_1', name: 'Website Redesign', user_id: 'user_123', username: 'john_doe', created_at: '2024-01-15' },
    { id: 'proj_2', name: 'Mobile App', user_id: 'user_123', username: 'john_doe', created_at: '2024-01-20' }
  ],
  tasks: [
    { id: 'task_1', project_id: 'proj_1', project_name: 'Website Redesign', task_name: 'Design Mockups', user_id: 'user_123', username: 'john_doe', checked: false, start_date: '2024-02-01', finish_date: '2024-02-10' },
    { id: 'task_2', project_id: 'proj_1', project_name: 'Website Redesign', task_name: 'Frontend Development', user_id: 'user_123', username: 'john_doe', checked: true, start_date: '2024-02-11', finish_date: '2024-02-25' },
    { id: 'task_3', project_id: 'proj_2', project_name: 'Mobile App', task_name: 'UI/UX Design', user_id: 'user_123', username: 'john_doe', checked: false, start_date: '2024-02-05', finish_date: '2024-02-15' }
  ]
};

const TaskManagementSystem = () => {
  const [projects, setProjects] = useState(mockSupabase.projects);
  const [tasks, setTasks] = useState(mockSupabase.tasks);
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskStartDate, setNewTaskStartDate] = useState('');
  const [newTaskFinishDate, setNewTaskFinishDate] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [currentView, setCurrentView] = useState('projects');
  const loggedInUser = JSON.parse(localStorage.getItem("ganttUser")) || {};
  const username = loggedInUser.username || "";
  const userId = loggedInUser.user_id || "";

  const [formData, setFormData] = useState({
    project: '',
    user_id: userId,
    username: username,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  

  // Filter tasks for selected project
  const projectTasks = selectedProject 
    ? tasks.filter(task => task.project_id === selectedProject.id)
    : [];

  // Create new project
  const createProject = () => {
    if (!newProjectName.trim()) return;
    
    const newProject = {
      id: `proj_${Date.now()}`,
      name: newProjectName,
      user_id: MOCK_USER.id,
      username: MOCK_USER.username,
      created_at: new Date().toISOString().split('T')[0]
    };
    
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setShowProjectForm(false);
  };

  

  // Create new task
  const createTask = () => {
    if (!newTaskName.trim() || !selectedProject || !newTaskStartDate || !newTaskFinishDate) return;
    
    const newTask = {
      id: `task_${Date.now()}`,
      project_id: selectedProject.id,
      project_name: selectedProject.name,
      task_name: newTaskName,
      user_id: MOCK_USER.id,
      username: MOCK_USER.username,
      checked: false,
      start_date: newTaskStartDate,
      finish_date: newTaskFinishDate
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskName('');
    setNewTaskStartDate('');
    setNewTaskFinishDate('');
    setShowTaskForm(false);
  };

  // Toggle task completion
  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, checked: !task.checked } : task
    ));
  };

  // Calculate Gantt chart dimensions
  const calculateGanttData = () => {
    if (projectTasks.length === 0) return { minDate: null, maxDate: null, tasks: [] };
    
    const dates = projectTasks.flatMap(task => [task.start_date, task.finish_date]);
    const minDate = new Date(Math.min(...dates.map(d => new Date(d))));
    const maxDate = new Date(Math.max(...dates.map(d => new Date(d))));
    
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const ganttTasks = projectTasks.map(task => {
      const startDate = new Date(task.start_date);
      const endDate = new Date(task.finish_date);
      const startOffset = Math.ceil((startDate - minDate) / (1000 * 60 * 60 * 24));
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return {
        ...task,
        startOffset: (startOffset / totalDays) * 100,
        width: (duration / totalDays) * 100
      };
    });
    
    return { minDate, maxDate, tasks: ganttTasks, totalDays };
  };

  const ganttData = calculateGanttData();



  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const username = loggedInUser.username || "";
  const userId = loggedInUser.user_id || "";


    console.log(username)
    console.log(userId)

    
    if (!userId || !username) {
      alert("User info not found.");
      setLoading(false);
      return;
    }

    const { error } = await Supabase.from("staff-project").insert([
      {
        user_id: userId,
        username: username,
        project_name: projectName,
      },
    ]);

    if (error) {
      console.error("Error inserting project:", error.message);
      alert("Failed to save project.");
    } else {
      alert("Project saved successfully!");
      setProjectName("");
    }

    setLoading(false);
  };

  return (
    <div className="task-management-container">

      <div className="task-header">
        <h5 style={{color:'#6b7280'}}>Personal Projects Mangement</h5>
        <div className="user-info">
          <User size={20} />
          <span>Welcome, {username}</span>
        </div>
      </div>

      <div className="nav-tabs">
        <button 
          className={`nav-tab ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => setCurrentView('projects')}
        >
          Projects
        </button>
        <button 
          className={`nav-tab ${currentView === 'tasks' ? 'active' : ''}`}
          onClick={() => setCurrentView('tasks')}
        >
          Tasks
        </button>
        <button 
          className={`nav-tab ${currentView === 'gantt' ? 'active' : ''}`}
          onClick={() => setCurrentView('gantt')}
        >
          Gantt Chart
        </button>
      </div>

      {currentView === 'projects' && (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#2d3748' }}>Projects</h2>
            <button className="btn btn-primary" onClick={() => setShowProjectForm(!showProjectForm)}>
              <Plus size={20} />
              New Project
            </button>
          </div>

          {showProjectForm && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f7fafc', borderRadius: '10px' }}>
              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    required
                    placeholder="Enter project name"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
              <button className='btn btn-success' type="submit" disabled={loading} onClick={handleSubmit}>{loading ? "Creating..." : "Create Project"}</button>

                <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowProjectForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="projects-grid">
            {projects.map(project => (
              <div
                key={project.id}
                className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <h3>{project.name}</h3>
                <div className="project-meta">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </div>
                <div className="project-meta">
                  Tasks: {tasks.filter(t => t.project_id === project.id).length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'tasks' && (
        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#2d3748' }}>
              Tasks {selectedProject && `- ${selectedProject.name}`}
            </h2>
            {selectedProject && (
              <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={20} />
                New Task
              </button>
            )}
          </div>

          {!selectedProject && (
            <div className="empty-state">
              <h3>Select a Project</h3>
              <p>Choose a project from the Projects tab to view and manage tasks.</p>
            </div>
          )}

          {selectedProject && showTaskForm && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f7fafc', borderRadius: '10px' }}>
              <div className="form-group">
                <label>Task Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Finish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newTaskFinishDate}
                    onChange={(e) => setNewTaskFinishDate(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-success" onClick={createTask}>
                  Create Task
                </button>
                <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowTaskForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          

          {selectedProject && (
            <div className="tasks-list">
              {projectTasks.length === 0 ? (
                <div className="empty-state">
                  <h3>No Tasks Yet</h3>
                  <p>Create your first task to get started.</p>
                </div>
              ) : (
                projectTasks.map(task => (
                  <div key={task.id} className={`task-item ${task.checked ? 'completed' : ''}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {task.checked ? <CheckCircle2 size={20} color="#48bb78" /> : <Circle size={20} color="#a0aec0" />}
                    </button>
                    <div className="task-content">
                      <div className="task-name">{task.task_name}</div>
                      <div className="task-dates">
                        <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        {new Date(task.start_date).toLocaleDateString()} - {new Date(task.finish_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      



        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0, color: '#2d3748' }}>
              Tasks - Web design
            </h2>
              <button className="btn btn-primary" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={20} />
                New Task
              </button>
          </div>

        

          {selectedProject && showTaskForm && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f7fafc', borderRadius: '10px' }}>
              <div className="form-group">
                <label>Task Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Enter task name"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newTaskStartDate}
                    onChange={(e) => setNewTaskStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Finish Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newTaskFinishDate}
                    onChange={(e) => setNewTaskFinishDate(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-success" onClick={createTask}>
                  Create Task
                </button>
                <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowTaskForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          

          {selectedProject && (
            <div className="tasks-list">
              {projectTasks.length === 0 ? (
                <div className="empty-state">
                  <h3>No Tasks Yet</h3>
                  <p>Create your first task to get started.</p>
                </div>
              ) : (
                projectTasks.map(task => (
                  <div key={task.id} className={`task-item ${task.checked ? 'completed' : ''}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {task.checked ? <CheckCircle2 size={20} color="#48bb78" /> : <Circle size={20} color="#a0aec0" />}
                    </button>
                    <div className="task-content">
                      <div className="task-name">{task.task_name}</div>
                      <div className="task-dates">
                        <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                        {new Date(task.start_date).toLocaleDateString()} - {new Date(task.finish_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      {currentView === 'gantt' && (
        <div className="content-card">
          <div className="gantt-header">
            <BarChart3 size={24} />
            <h2 style={{ margin: 0, color: '#2d3748' }}>
              Gantt Chart {selectedProject && `- ${selectedProject.name}`}
            </h2>
          </div>

          {!selectedProject && (
            <div className="empty-state">
              <h3>Select a Project</h3>
              <p>Choose a project to view its Gantt chart.</p>
            </div>
          )}

          {selectedProject && projectTasks.length === 0 && (
            <div className="empty-state">
              <h3>No Tasks to Display</h3>
              <p>Add tasks to see the Gantt chart visualization.</p>
            </div>
          )}

          {selectedProject && projectTasks.length > 0 && (
            <div className="gantt-chart">
              <div className="gantt-timeline">
                {ganttData.tasks.map(task => (
                  <div key={task.id} className="gantt-row">
                    <div className="gantt-label">{task.task_name}</div>
                    <div className="gantt-bars">
                      <div
                        className={`gantt-bar ${task.checked ? 'completed' : 'pending'}`}
                        style={{
                          left: `${task.startOffset}%`,
                          width: `${task.width}%`
                        }}
                      >
                        {task.checked ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {ganttData.minDate && ganttData.maxDate && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#718096' }}>
                  Timeline: {ganttData.minDate.toLocaleDateString()} - {ganttData.maxDate.toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="content-card">
          <div className="gantt-header">
            <BarChart3 size={24} />
            <h2 style={{ margin: 0, color: '#2d3748' }}>
              Gantt Chart {selectedProject && `- ${selectedProject.name}`}
            </h2>
          </div>

          {!selectedProject && (
            <div className="empty-state">
              <h3>Select a Project</h3>
              <p>Choose a project to view its Gantt chart.</p>
            </div>
          )}

          {selectedProject && projectTasks.length === 0 && (
            <div className="empty-state">
              <h3>No Tasks to Display</h3>
              <p>Add tasks to see the Gantt chart visualization.</p>
            </div>
          )}

          {selectedProject && projectTasks.length > 0 && (
            <div className="gantt-chart">
              <div className="gantt-timeline">
                {ganttData.tasks.map(task => (
                  <div key={task.id} className="gantt-row">
                    <div className="gantt-label">{task.task_name}</div>
                    <div className="gantt-bars">
                      <div
                        className={`gantt-bar ${task.checked ? 'completed' : 'pending'}`}
                        style={{
                          left: `${task.startOffset}%`,
                          width: `${task.width}%`
                        }}
                      >
                        {task.checked ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {ganttData.minDate && ganttData.maxDate && (
                <div style={{ marginTop: '20px', textAlign: 'center', color: '#718096' }}>
                  Timeline: {ganttData.minDate.toLocaleDateString()} - {ganttData.maxDate.toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
};

export default TaskManagementSystem;