import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Plus, Check, User, Clock, BarChart3, CheckCircle2, Circle } from 'lucide-react';
import { Supabase } from "../config/supabase-config";
import { MoreVertical, PlayCircle } from 'lucide-react'; // Import icons at the top
import { Gantt } from "gantt-task-react";
import Gannt from '../Component/Gannt';
import "gantt-task-react/dist/index.css";
import { RiDeleteBin2Fill } from "react-icons/ri";
import EditTask from '../Component/EditTask';
import { LuPencilLine } from "react-icons/lu";
import EditProjectModal from '../Component/EditProjectModal';



const Personal = () => {


    const [showEditProjectModal, setShowEditProjectModal] = useState(false);

    const menuItemStyle = {
        display: 'block',
        width: '100%',
        padding: '8px 12px',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        fontSize: '13px',
        color: '#2d3748',
        cursor: 'pointer'
      };
      

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
    const [collapsedProjects, setCollapsedProjects] = useState({});
    const [subtaskName, setSubtaskName] = useState('');
    const [selectedTask, setSelectedTask] = useState(null);
    const [showSubtaskForm, setShowSubtaskForm] = useState(false);

    const [userProjects, setUserProjects] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [userTasks, setUserTasks] = useState([]);

    const [ganttTasks, setGanttTasks] = useState([]);



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


    const groupTasksByProject = (tasks) => {
        return tasks.reduce((acc, task) => {
        if (!acc[task.project]) {
            acc[task.project] = [];
        }
        acc[task.project].push(task);
        return acc;
        }, {});
    };
    
    const toggleProjectCollapse = (projectName) => {
        setCollapsedProjects(prev => ({
        ...prev,
        [projectName]: !prev[projectName]
        }));
    };
  
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
      fetchProjects(); 
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
  

  const handleStartTask = async (taskId) => {
    const confirmed = window.confirm("Are you sure you want to start this task?");
    if (!confirmed) return;
  
    const { error } = await Supabase
      .from("Staff-tasks")
      .update({ status: "in progress" })
      .eq("id", taskId);
  
    if (error) {
      console.error("Error updating task status:", error.message);
      alert("Failed to start task.");
    } else {
      fetchTasks();
    }
  };
  
  const handleCompleteTask = async (taskId) => {
    const { error } = await Supabase
      .from("Staff-tasks")
      .update({ status: "completed", checked: true })
      .eq("id", taskId);
  
    if (error) {
      console.error("Error completing task:", error.message);
      alert("Failed to complete task.");
    } else {
      fetchTasks();
    }
  };

   const fetchSubtasks = useCallback(async () => {
    const { data, error } = await Supabase
        .from("Staff-subtasks")
        .select("*")
        .eq("user_id", userId);

    if (!error) setSubtasks(data || []);
    }, [userId]);


    useEffect(() => {
        fetchTasks();
        fetchSubtasks(); // ← include this to load subtasks
      }, [fetchTasks, fetchSubtasks]);
  

      const groupSubtasksByTask = (subtasks) => {
        return subtasks.reduce((acc, subtask) => {
          if (!acc[subtask.task_id]) {
            acc[subtask.task_id] = [];
          }
          acc[subtask.task_id].push(subtask);
          return acc;
        }, {});
      };
      

  const handleSubtaskSubmit = async () => {
    if (!subtaskName || !selectedTask) {
      alert("Please enter a subtask name.");
      return;
    }
  
    const { error } = await Supabase.from("Staff-subtasks").insert([
      {
        user_id: userId,
        username,
        project: selectedTask.project,
        project_id: selectedTask.project_id,
        task: selectedTask.task,
        task_id: selectedTask.id,
        subtask: subtaskName,
        status:'pending'
      },
    ]);
  
    if (error) {
      console.error("Error saving subtask:", error.message);
      alert("Failed to save subtask.");
    } else {
      alert("Subtask added!");
      setSubtaskName("");
      setShowSubtaskForm(false);
      fetchSubtasks(); // ✅ 
    }
  };
  
  
    const [subtasks, setSubtasks] = useState([]);

    const groupedSubtask = groupSubtasksByTask(subtasks);
    const [groupedSubtasks, setGroupedSubtasks] = useState({});

    useEffect(() => {
    if (subtasks.length > 0) {
        const grouped = groupSubtasksByTask(subtasks); // groups by taskId
        setGroupedSubtasks(grouped);
    }
    }, [subtasks]);
    

    
    const handleSubtaskToggle = async (taskId, subtaskId) => {
        // 1. Get current subtask's status
        const currentSubtask = groupedSubtasks[taskId]?.find(st => st.id === subtaskId);
        if (!currentSubtask) return;
      
        const newSubtaskStatus =
          currentSubtask.status === "completed" ? "pending" : "completed";
      
        // 2. Update groupedSubtasks UI state
        setGroupedSubtasks((prev) => {
          const updated = { ...prev };
          if (!updated[taskId]) return prev;
      
          updated[taskId] = updated[taskId].map((subtask) =>
            subtask.id === subtaskId
              ? { ...subtask, status: newSubtaskStatus }
              : subtask
          );
      
          return updated;
        });
      
        await Supabase
          .from("Staff-subtasks")
          .update({ status: newSubtaskStatus })
          .eq("id", subtaskId);
      
        // 4. Get latest subtasks (including the one just updated)
        const updatedSubtasks = groupedSubtasks[taskId]?.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, status: newSubtaskStatus }
            : subtask
        );
      
        // 5. Check if ALL subtasks are now completed
        const allCompleted = updatedSubtasks?.every(
          (subtask) => subtask.status === "completed"
        );
      
        if (allCompleted) {
          // 6. Update the parent task in Supabase
          await Supabase
            .from("Staff-tasks")
            .update({ status: "completed", checked: true })
            .eq("id", taskId);
      
          // Optional: Refetch tasks if needed
          fetchTasks?.();
        }
      };
      
      
      const groupedTasks = groupTasksByProject(userTasks);

      const transformTasksToGanttFormat = (tasks) => {
        return tasks.map(task => ({
          id: task.id,
          name: task.task,
          start: new Date(task.start_date),
          end: new Date(task.end_date),
          type: "task",
          progress: task.status === "completed" ? 100 : 0,
          isDisabled: false,
          project: task.project,
        }));
      };

      const [activeFilter, setActiveFilter] = useState("All");

      useEffect(() => {
        if (userProjects.length > 0 && !selectedProject) {
          setSelectedProject(userProjects[0]);
        }
      }, [userProjects, selectedProject]);
      

      const handleDeleteSubtask = async (subtaskId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this subtask?");
        if (!confirmDelete) return;
      
        const { error } = await Supabase
          .from("Staff-subtasks")
          .delete()
          .eq("id", subtaskId);
      
        if (error) {
          console.error("Error deleting subtask:", error.message);
          alert("Failed to delete subtask.");
        } else {
          alert("Subtask deleted successfully.");
          fetchSubtasks(); // Refresh the list
        }
      };
      

      const [selectedTasks, setSelectedTasks] = useState(null);
      const [showModal, setShowModal] = useState(false);
      
      const openEditModal = (task) => {
        setSelectedTask(task);
        setShowModal(true);
        fetchTasks()
      };

      const handleDeleteTask = async (taskId, refreshTasks) => {
        if (!taskId) return;
      
        const confirmDelete = window.confirm("Are you sure you want to delete this task and its subtasks?");
        if (!confirmDelete) return;
      
        try {
          const { error: subtaskError } = await Supabase
            .from('Staff-subtasks')
            .delete()
            .eq('task_id', taskId);
      
          if (subtaskError) throw subtaskError;
      
          const { error: taskError } = await Supabase
            .from('Staff-tasks')
            .delete()
            .eq('id', taskId);
      
          if (taskError) throw taskError;
      
          alert('Task and subtasks deleted successfully!');
          if (refreshTasks) refreshTasks();
        } catch (err) {
          console.error('Error deleting task:', err.message);
          alert('Failed to delete task.');
        }
      };


      const handleEditProject = async (projectId, newProjectName, refreshData) => {
  if (!projectId || !newProjectName) {
    alert("Project ID and new name are required.");
    return;
  }

  try {
    // Update project name in Staff-project table
    const { error: projectError } = await Supabase
      .from('Staff-project')
      .update({ project: newProjectName })
      .eq('id', projectId);

    if (projectError) throw projectError;

    // Update project name in Staff-tasks table
    const { error: taskError } = await Supabase
      .from('Staff-tasks')
      .update({ project: newProjectName })
      .eq('project_id', projectId);

    if (taskError) throw taskError;

    // Update project name in Staff-subtasks table
    const { error: subtaskError } = await Supabase
      .from('Staff-subtasks')
      .update({ project: newProjectName })
      .eq('project_id', projectId);

    if (subtaskError) throw subtaskError;

    alert("Project updated successfully!");
    if (refreshData) refreshData(); // Re-fetch data if provided
  } catch (err) {
    console.error("Error updating project:", err.message);
    alert("Failed to update project.");
  }
};

const deleteProject = async (projectId) => {
    if (!projectId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this project and all related data?");
    if (!confirmDelete) return;
  
    try {
      // 1. Delete subtasks linked to this project
      const { error: subtaskError } = await Supabase
        .from('Staff-subtasks')
        .delete()
        .eq('project_id', projectId);
  
      if (subtaskError) throw subtaskError;
  
      // 2. Delete tasks linked to this project
      const { error: taskError } = await Supabase
        .from('Staff-tasks')
        .delete()
        .eq('project_id', projectId);
  
      if (taskError) throw taskError;
  
      // 3. Delete the project itself
      const { error: projectError } = await Supabase
        .from('Staff-project')
        .delete()
        .eq('id', projectId);
  
      if (projectError) throw projectError;
  
      alert('Project and all related data deleted successfully.');
      window.location.reload();

      // Optionally refresh your projects/tasks here
    } catch (err) {
      console.error("Error deleting project:", err.message);
      alert("An error occurred while deleting the project.");
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
                        <h3 style={{display:'flex', justifyContent:'space-between'}}>{project.project}   
                        <div style={{display:'flex', gap:'13px'}}>
                            <LuPencilLine style={{cursor:'pointer', fontSize:'13px'}} onClick={() => {
                                setSelectedProject(project);
                                setShowEditProjectModal(true);
                            }}/> 
                            <RiDeleteBin2Fill onClick={() => deleteProject(project.id)} style={{cursor:'pointer', fontSize:'13px'}}/>
                            </div></h3>
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

        

            {isFetching ? (
            <p>Loading projects...</p>
            ) : userTasks.length > 0 ? (
                <div className="tasks-list">
                  {Object.entries(groupTasksByProject(userTasks)).map(([projectName, tasks]) => (
                    <div key={projectName} style={{ marginBottom: '20px' }}>
                      <h3 
                        style={{ cursor: 'pointer', color: '#2d3748' }}
                        onClick={() => toggleProjectCollapse(projectName)}
                      >
                         {collapsedProjects[projectName] ? '▼' : '▲'}{projectName}
                      </h3>
              
                      {!collapsedProjects[projectName] && (
                        <div className="task-items">
                          {tasks.map(task => (
                            <div className='task-item' key={task.id}>
                              <button
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding:0 }}
                              >
                                <input
                                    type="checkbox"
                                    checked={task.status === "completed"}
                                    disabled={
                                        groupedSubtask[task.id]?.length > 0 &&
                                        !groupedSubtask[task.id].every(sub => sub.status === "completed")
                                    }
                                    onChange={() => handleCompleteTask(task.id)}
                                    />

                              </button>
                              <div className="task-content">
                                <div className="task-name">{task.task}</div>
                                    <div className="task-dates">
                                    <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                    {new Date(task.start_date).toLocaleDateString()} – {new Date(task.end_date).toLocaleDateString()}
                                    </div>
                                </div>

                                


                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {task.status === "pending" && (
                                <button
                                    className="btn btn-sm btn-warning"
                                    style={{color: "#b45309", backgroundColor: "#fef3c7",}}
                                    onClick={() => handleStartTask(task.id)}
                                >
                                    <PlayCircle size={16} style={{ marginRight: '6px' }} />
                                    Start Task
                                </button>
                                )}

                                {task.status === "in progress" && (
                                <button style={{color: "#1d4ed8", backgroundColor: "#dbeafe",}} className="btn btn-sm btn-info" disabled>
                                    In Progress...
                                </button>
                                )}

                                {task.status === "completed" && (
                                <button style={{color: "#15803d", backgroundColor: "#bbf7d0"}} className="btn" disabled>
                                    Completed
                                </button>
                                )}

                                

                                    <div className="dropdown" style={{ position: 'relative' }}>
                                    <button
                                        className="btn"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', zIndex:1 }}
                                        onClick={() => {
                                        const menu = document.getElementById(`menu-${task.id}`);
                                        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                                        }}
                                    >
                                        <MoreVertical size={18} style={{zIndex:1}}/>
                                    </button>
                                    <div
                                        id={`menu-${task.id}`}
                                        className="dropdown-menu"
                                        style={{
                                        display: 'none',
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        backgroundColor: '#ffffff',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        zIndex: 1000000,
                                        minWidth: '140px'
                                        }}
                                    >
                                       

                                        {task.status !== "completed" &&  (
                                            <button 
                                            className="dropdown-item"
                                            style={menuItemStyle}
                                            onClick={() => openEditModal(task)}
                                            >
                                            ✏️ Edit Task
                                            </button>
                                        )}

                                        <button
                                        className="dropdown-item"
                                        style={menuItemStyle}
                                        onClick={() => handleDeleteTask(task.id, fetchTasks)}
                                        >
                                        🗑️ Delete Task
                                        </button>
                                        

                                        {task.status === "pending" && (
                                            <button 
                                            className="dropdown-item"
                                            style={menuItemStyle}
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setShowSubtaskForm(true);
                                            }}
                                            >
                                            <Plus size={14} /> Add Subtask
                                            </button>
                                        )}
                                    </div>

                                    
                                </div>

                                
                                </div>

                                {groupedSubtasks[task.id]?.length > 0 && (
                                    <ul>
                                        {groupedSubtasks[task.id].map((subtask) => (
                                        <li key={subtask.id} style={{ marginBottom: '3px', display:"flex", justifyContent:'space-between' }}>
                                            <div>
                                                <input
                                                    type="checkbox"
                                                    checked={subtask.status === 'completed'}
                                                    disabled={subtask.status === 'completed'} // disables checkbox after being checked
                                                    onChange={() => handleSubtaskToggle(task.id, subtask.id)}
                                                    style={{ marginRight: '6px' }}
                                                />
                                                {subtask.subtask}
                                            </div>

                                            

                                            <RiDeleteBin2Fill
                                                style={{ color: 'gray', cursor: 'pointer' }}
                                                onClick={() => handleDeleteSubtask(subtask.id)}
                                                />

                                        </li>
                                        ))}
                                    </ul>
                                    )}

                              
                                </div>


                                

                                
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No tasks found.</p>
              )}

                {showSubtaskForm && selectedTask && (
                <div style={{ padding: '20px', background: '#d3d4e2', borderRadius: '10px', marginTop: '20px' }}>
                    <h5 style={{fontSize:'17px', marginBottom:"15px"}}>Add Subtask to: {selectedTask.task}</h5>
                    <input
                    type="text"
                    className="form-control"
                    placeholder="Subtask name"
                    value={subtaskName}
                    onChange={(e) => setSubtaskName(e.target.value)}
                    />
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button className="btn btn-success" onClick={handleSubtaskSubmit}>Save Subtask</button>
                    <button className="btn btn-secondary" onClick={() => setShowSubtaskForm(false)}>Cancel</button>
                    </div>
                </div>
                )}



        </div>

        <EditTask
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            task={selectedTask}
            refreshTasks={fetchTasks}
            />

        <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        project={selectedProject}
        refreshProjects={fetchProjects}
        />

        {userTasks.length > 0 && (
            <div style={{ height: "auto", width:'100%', margin:'auto', backgroundColor:'#fff', borderRadius:'25px', padding:'25px' }}>
                <Gannt
                userId={userId}
                username={username}
                userProjects={userProjects}
                userTasks={userTasks}
                fetchTasks={fetchTasks}
                />
            </div>
            )}






      
    </div>
  )
}

export default Personal