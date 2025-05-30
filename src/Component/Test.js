import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Check, User, Clock, BarChart3, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { Supabase } from "../config/supabase-config";

const Personal = () => {

    const loggedInUser = JSON.parse(localStorage.getItem("ganttUser")) || {};
    const username = loggedInUser.username || "";
    const userId = loggedInUser.user_id || "";
    const [currentView, setCurrentView] = useState('projects');
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [taskName, setTaskName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [finishDate, setFinishDate] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [expandedProjectId, setExpandedProjectId] = useState(null);
    const [isFetchingTasks, setIsFetchingTasks] = useState(true);


    const [userProjects, setUserProjects] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [userTasks, setUserTasks] = useState([]);


  const fetchProjects = useCallback(async () => {
    if (!userId) return;

    setIsFetching(true);
    const { data, error } = await Supabase
      .from("Staff-project")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch projects:", error.message);
      setUserProjects([]);
    } else {
      setUserProjects(data);
    }

    setIsFetching(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);



  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    setIsFetching(true);
    const { data, error } = await Supabase
      .from("Staff-tasks")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch tasks:", error.message);
      setUserTasks([]);
    } else {
      setUserTasks(data);
    }

    setIsFetching(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!userId || !username) {
      alert("User info not found.");
      setLoading(false);
      return;
    }

    const { error } = await Supabase.from("Staff-project").insert([
      {
        user_id: userId,
        username: username,
        project: projectName,
      },
    ]);

    if (error) {
      console.error("Error inserting project:", error.message);
      alert("Failed to save project.");
    } else {
      alert("Project saved successfully!");
      setProjectName("");
      fetchProjects(); // 👈 Refresh project list
    }

    setLoading(false);
  };

  const handleTaskSubmit = async () => {
    setLoading(true);
    if (!selectedProjectId || !taskName || !startDate || !finishDate) {
      alert("Please fill all fields and select a project.");
      setLoading(false);
      return;
    }
  
    const selectedProject = userProjects.find(p => p.id === Number(selectedProjectId)); // 🔧 fixed type mismatch
  
    if (!selectedProject) {
      alert("Invalid project selected.");
      return;
    }
  
    const { error } = await Supabase.from("Staff-tasks").insert([
      {
        user_id: userId,
        username: username,
        project_id: selectedProject.id,
        project: selectedProject.project,
        task: taskName,
        start_date: startDate,
        end_date: finishDate,
        status: "pending",
        checked: false,
      },
    ]);
  
    if (error) {
      console.error("Error creating task:", error.message);
      alert("Failed to create task.");
    } else {
      alert("Task created successfully.");
      setTaskName("");
      setStartDate("");
      setFinishDate("");
      setSelectedProjectId("");
      setShowTaskForm(false);
      fetchTasks()
    }
    setLoading(false);
  };
  
  const toggleProjectExpansion = (projectId) => {
    setExpandedProjectId(expandedProjectId === projectId ? null : projectId);
  };

  const getTasksForProject = (projectId) => {
    return userTasks.filter(task => task.project_id === projectId);
  };
  const toggleTaskCompletion = async (taskId, currentChecked) => {
    const { error } = await Supabase
      .from("Staff-tasks")
      .update({ checked: !currentChecked, status: !currentChecked ? "completed" : "pending" })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error.message);
      alert("Failed to update task.");
    } else {
      fetchTasks(); // Refresh tasks
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
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


        
            {isFetching ? (
            <p>Loading projects...</p>
            ) : userProjects.length > 0 ? (
                <div className="projects-grid">
                    {userProjects.map((project) => (
                    <div className='project-card' key={project.id} style={{ marginBottom: '10px' }}>
                        <h3>{project.project}</h3>
                        <div className="project-meta">
                            Created: {new Date(project.created_at).toLocaleDateString()}
                        </div>
                    </div>
                    ))}
                </div>
            ) : (
            <p>You have no projects yet. Click "New Project" to create one.</p>
            )}

        
          
        </div>
      )}

        <div className="content-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 style={{ margin: 0, color: '#2d3748' }}>
              Tasks {selectedProject && `- ${selectedProject.name}`}
            </h2>
              <button className="btn btn-primary" 
              onClick={() => {
                if (userProjects.length === 0) {
                  alert("Please create a project first before adding tasks.");
                  return;
                }
                setShowTaskForm(!showTaskForm);
              }}
              
              >
                <Plus size={20} />
                New Task
              </button>
          </div>

         

          {showTaskForm && (
            <div style={{ marginBottom: '30px', padding: '20px', background: '#f7fafc', borderRadius: '10px' }}>
                <div className="form-group">
                <label>Select Project</label>
                <select
                    className="form-control"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                >
                    <option value="">-- Select Project --</option>
                    {userProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.project}
                    </option>
                    ))}
                </select>
                </div>

                <div className="form-group">
                <label>Task Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Enter task name"
                />
                </div>

                <div className="form-row">
                <div className="form-group">
                    <label>Start Date</label>
                    <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Finish Date</label>
                    <input
                    type="date"
                    className="form-control"
                    value={finishDate}
                    onChange={(e) => setFinishDate(e.target.value)}
                    />
                </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                <button className='btn btn-success' type="submit" disabled={loading} onClick={handleTaskSubmit}>{loading ? "Creating..." : "Create Task"}</button>

                <button className="btn" style={{ background: '#e2e8f0' }} onClick={() => setShowTaskForm(false)}>
                    Cancel
                </button>
                </div>
            </div>
            )}

        

            {userProjects.map((project) => (
            <div key={project.id} className="project-task-section">
                <div
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginBottom: '8px' }}
                onClick={() => toggleProjectExpansion(project.id)}
                >
                {expandedProjectId === project.id ? <ChevronDown /> : <ChevronRight />}
                <h3 style={{ marginLeft: '8px' }}>{project.project}</h3>
                </div>

                {expandedProjectId === project.id && (
                <ul className="task-list">
                    {getTasksForProject(project.id).length > 0 ? (
                    getTasksForProject(project.id).map((task) => (
                        <li key={task.id} className="task-item" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <input
                            type="checkbox"
                            checked={task.checked}
                            onChange={() => toggleTaskCompletion(task.id, task.checked)}
                            />{" "}
                            <span style={{ textDecoration: task.checked ? 'line-through' : 'none' }}>{task.task}</span>
                            <div style={{ fontSize: '12px', color: '#718096' }}>
                            {task.start_date} - {task.end_date}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: task.status === 'completed' ? 'green' : '#E53E3E' }}>
                            {task.status}
                        </div>
                        </li>
                    ))
                    ) : (
                    <p style={{ marginLeft: '16px', fontStyle: 'italic' }}>No tasks for this project.</p>
                    )}
                </ul>
                )}
            </div>
            ))}



        </div>

      
    </div>
  )
}

export default Personal