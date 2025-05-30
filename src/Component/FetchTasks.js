import { useState, useEffect } from "react";
import { useTaskContext } from "../context/TaskContext";
import { CiCirclePlus } from "react-icons/ci";
import { Supabase } from "../config/supabase-config";
import { IoCloseCircleOutline } from "react-icons/io5";


const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date)) return "";
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();
  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  return `${day}${getOrdinal(day)} ${month}, ${year}`;
};

const FetchTasks = () => {
  const { tasks, loading, updateTaskChecked, fetchTasks } = useTaskContext();
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [username, setUsername] = useState("");
  const [showModal, setShowModal] = useState(false);
const [subtaskTitle, setSubtaskTitle] = useState("");
const [selectedTask, setSelectedTask] = useState(null);
const [showStatusModal, setShowStatusModal] = useState(false);
const [task, setTask] = useState([]); // for local refresh after update



  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("ganttUser"));
    if (storedUser?.username) setUsername(storedUser.username);
  }, []);

  const userTasks = tasks.filter(task => task.assignedTo === username);

  const groupedByProject = userTasks.reduce((acc, task) => {
    const project = task.project || "No Project";
    const department = task.department || "Unassigned";
    if (!acc[project]) acc[project] = {};
    if (!acc[project][department]) acc[project][department] = [];
    acc[project][department].push(task);
    return acc;
  }, {});

  // Initialize collapsedProjects state when projects are loaded
  useEffect(() => {
    const projectKeys = Object.keys(groupedByProject);
    const collapsedState = {};
    projectKeys.forEach(project => {
      collapsedState[project] = false; // All collapsed by default
    });
    setCollapsedProjects(collapsedState);
  }, [tasks, username]);

  const toggleProjectCollapse = (projectToToggle) => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectToToggle]: !prev[projectToToggle]
    }));
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  
  
  const handleSubtaskSubmit = async () => {
    if (!subtaskTitle.trim()) {
      alert("Please enter a subtask title");
      return;
    }
  
    setIsSubmitting(true);
    setSuccessMessage(""); // Clear any previous message
  
    const newSubtask = {
      subtask: subtaskTitle.trim(),
      task_id: selectedTask.id,
      task: selectedTask.task,
      dept_id: selectedTask.dept_id,
      department: selectedTask.department,
      project_id: selectedTask.project_id,
      project: selectedTask.project,
      createdBy: username,
      checked: false
    };
  
    try {
      const { data, error } = await Supabase
        .from('gantt-subtasks')
        .insert([newSubtask]);
  
      if (error) {
        console.error("Insert error:", error);
        alert("Failed to add subtask");
      } else {
        setSubtaskTitle("");
        setShowModal(false);
        setSuccessMessage("Subtask added successfully!");
        fetchSubtasks(selectedTask.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("ganttUser"));
    if (storedUser?.username) setUsername(storedUser.username);
  
    Supabase.auth.getSession().then(({ data, error }) => {
      console.log("Supabase session:", data);
      if (error) console.error("Auth error:", error);
    });
  }, []);
  
  
  useEffect(() => {
    tasks.forEach(task => {
      fetchSubtasks(task.id);
    });
  }, [tasks]);
  

  const toggleChecked = async (taskId, currentChecked) => {
    const success = await updateTaskChecked(taskId, !currentChecked);
    if (!success) return alert("Failed to update task checkbox.");
  
    // fetch subtasks
    const { data: subs, error } = await Supabase
      .from("gantt-subtasks")
      .select("checked")
      .eq("task_id", taskId);
  
    if (error) return;
  
    if (subs.length > 0) {
      const allChecked = subs.every(sub => sub.checked);
      const anyChecked = subs.some(sub => sub.checked);
      if (allChecked) {
        await updateTaskStatus(taskId, "Completed");
      } else if (anyChecked) {
        await updateTaskStatus(taskId, "In Progress");
      } else {
        await updateTaskStatus(taskId, "Pending");
      }
    } else {
      await updateTaskStatus(taskId, !currentChecked ? "Completed" : "Pending");
    }

    fetchTasks();

  };

  

  const [subtasks, setSubtasks] = useState({}); // key: task_id, value: subtasks array

  const fetchSubtasks = async (taskId) => {
    const { data, error } = await Supabase
      .from("gantt-subtasks")
      .select("*")
      .eq("task_id", taskId);

    if (error) {
      console.error("Failed to fetch subtasks", error);
      return;
    }

    setSubtasks((prev) => ({
      ...prev,
      [taskId]: data,
    }));
  };

  const toggleSubtaskChecked = async (subtaskId, currentChecked, taskId) => {
    const { error } = await Supabase
      .from("gantt-subtasks")
      .update({ checked: !currentChecked })
      .eq("id", subtaskId);
  
    if (error) {
      console.error("Error updating subtask", error);
      alert("Failed to update subtask");
      return;
    }
  
    await fetchSubtasks(taskId);
  
    const { data: updatedSubs, error: subErr } = await Supabase
      .from("gantt-subtasks")
      .select("checked")
      .eq("task_id", taskId);
  
    if (subErr) return;
  
    const allChecked = updatedSubs.every(sub => sub.checked);
    const anyChecked = updatedSubs.some(sub => sub.checked);
  
    if (allChecked) {
      await updateTaskChecked(taskId, true);
      await updateTaskStatus(taskId, "Completed");
    } else if (anyChecked) {
      await updateTaskChecked(taskId, false);
      await updateTaskStatus(taskId, "In Progress");
    } else {
      await updateTaskChecked(taskId, false);
      await updateTaskStatus(taskId, "Pending");
    }
    fetchTasks();
  };
  


  const handleDeleteSubtask = async (subtaskId, taskId) => {
    const { error } = await Supabase
      .from("gantt-subtasks")
      .delete()
      .eq("id", subtaskId);
  
    if (error) {
      console.error("Error deleting subtask", error);
      alert("Failed to delete subtask");
    } else {
      fetchSubtasks(taskId); // Refresh after delete
    }
  };
  
  
  
  const getStatusStyles = (status) => {
    switch (status) {
      case "Pending":
        return {
          color: "#b45309", // amber-700
          backgroundColor: "#fef3c7", // amber-100
        };
      case "In Progress":
        return {
          color: "#1d4ed8", // blue-700
          backgroundColor: "#dbeafe", // blue-100
        };
      case "Completed":
        return {
          color: "#15803d", // green-700
          backgroundColor: "#bbf7d0", // green-100
        };
      default:
        return {
          color: "#334155", // slate-700
          backgroundColor: "#f1f5f9", // default light background
        };
    }
  };
  
  const handleStatusClick = (task) => {
    const taskSubtasks = subtasks[task.id] || [];
  
    if (taskSubtasks.length === 0 && task.status === "Pending") {
      setSelectedTask(task);
      setShowStatusModal(true);
    } else if (taskSubtasks.length > 0) {
      alert("This task has subtasks. Complete them to update status.");
    }
  };
  

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { error } = await Supabase
        .from("gantt-tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
  
      if (error) {
        console.error("Error updating status:", error.message);
        return;
      }
  
      // Refresh local task state after update
      setTask((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await fetchTasks();
    } catch (err) {
      console.error("Unexpected error updating status:", err.message);
    }
  };
  
  


  if (!username) return <p>Loading user info...</p>;
  if (loading) return <p>Loading tasks...</p>;

  return (
    <div>
      {Object.keys(groupedByProject).length === 0 ? (
        <p>No tasks assigned to {username}.</p>
      ) : (
        Object.entries(groupedByProject).map(([project, departments]) => (
          <div key={project} style={{ marginBottom: "20px" }}>
            <div
              style={{
                cursor: "pointer",
                background: "#f1f5f9",
                padding: "10px",
                fontWeight: 600,
                borderRadius: "6px",
                marginBottom: "10px",
                fontSize: '15px'
              }}
            >
              <span
                onClick={() => toggleProjectCollapse(project)}
                style={{
                  cursor: "pointer",
                  marginLeft: "10px",
                  fontSize: "16px",
                }}
                title="Toggle collapse"
              >
                {collapsedProjects[project] ? "▶" : "▼"}
              </span>
              
              {project}
            </div>

            {!collapsedProjects[project] && (
              Object.entries(departments).map(([department, deptTasks]) => {
                const total = deptTasks.length;
                let deptTotalPercent = 0;

                  deptTasks.forEach(task => {
                    const taskContribution = 100 / deptTasks.length; // each task equally contributes to department
                    const taskSubtasks = subtasks[task.id] || [];

                    if (taskSubtasks.length > 0) {
                      const checkedSubs = taskSubtasks.filter(sub => sub.checked).length;
                      const subPercent = taskContribution * (checkedSubs / taskSubtasks.length);
                      deptTotalPercent += subPercent;
                    } else {
                      if (task.checked) deptTotalPercent += taskContribution;
                    }
                  });

                  const percent = Math.round(deptTotalPercent);

                return (
                  <div key={department} style={{ marginBottom: "16px", paddingLeft: "15px" }}>
                    <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px", color: "#475569" }}>
                      {department}
                    </h4>

                    <ul style={{ listStyle: "none", paddingLeft: "0" }}>
                      {deptTasks.map((task) => (
                        <>
                          

                        
                          <li
                            key={task.id}
                            style={{
                              marginBottom: "12px",
                              borderBottom: "1px solid #e2e8f0",
                              paddingBottom: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={task.checked || false}
                                onChange={() => toggleChecked(task.id, task.checked)}
                                disabled={subtasks[task.id]?.length > 0} // Disable if subtasks exist
                                title={subtasks[task.id]?.length > 0 ? "Complete all subtasks to check this task" : "Mark task as complete"}
                                style={{ marginTop: "3px", cursor: subtasks[task.id]?.length > 0 ? "not-allowed" : "pointer" }}
                              />

                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    color: "#334155",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    display:'flex',
                                    justifyContent:'space-between',
                                    alignItems:'center'
                                  }}
                                >
                                  <p style={{
                                    textDecoration: task.checked ? "line-through" : "none",
                                    
                                  }}>{task.task}</p>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span
                                    onClick={() => handleStatusClick(task)}
                                    style={{
                                      ...getStatusStyles(task.status),
                                      padding: "5px 10px",
                                      fontSize:'11px',
                                      borderRadius: "6px",
                                      cursor: subtasks[task.id]?.length === 0 ? "pointer" : "not-allowed",
                                      opacity: subtasks[task.id]?.length === 0 ? 1 : 0.6,
                                    }}
                                    title={subtasks[task.id]?.length > 0 ? "Has subtasks, cannot manually update" : "Click to mark In Progress"}
                                  >
                                    {task.status === "Pending" ? "Start" : task.status}
                                  </span>

                                  </div>

                                  {task.status !== "Completed" && (
                                    <CiCirclePlus
                                      style={{ cursor: "pointer", marginLeft: "8px", fontSize:'16px' }}
                                      title="Add Subtask"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowModal(true);
                                      }}
                                    />
                                  )}


                                  
                                </div>
                                {task.date && (
                                  <div style={{ color: "#64748b", fontSize: "13px", marginTop: "4px" }}>
                                    Due: {formatDate(task.date)}
                                  </div>
                                )}

                                {subtasks[task.id] && subtasks[task.id].map((sub) => (
                                  <div key={sub.id} style={{
                                    marginTop: "6px",
                                    padding: "6px 10px",
                                    background: "#f9fafb",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                      <input
                                        type="checkbox"
                                        checked={sub.checked}
                                        onChange={() => toggleSubtaskChecked(sub.id, sub.checked, task.id)}
                                      />
                                      <div>
                                        <div style={{ textDecoration: sub.checked ? "line-through" : "none" }}>{sub.subtask}</div>
                                        <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                                          Created by: {sub.createdBy}
                                        </div>
                                      </div>
                                    </label>

                                    <button
                                      onClick={() => handleDeleteSubtask(sub.id, task.id)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        // color: "#ef4444",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        padding: "4px"
                                      }}
                                      title="Delete"
                                    >
                                      <IoCloseCircleOutline />

                                    </button>
                                  </div>
                                ))}


                              </div>
                            </div>
                          </li>
                        </>
                      ))}
                    </ul>

                    {/* Progress bar */}
                    <div style={{ marginTop: "8px" }}>
                      <div style={{ fontSize: "13px", color: "#475569", marginBottom: "4px" }}>
                        {percent}% Completed
                      </div>
                      <div style={{
                        background: "#e2e8f0",
                        borderRadius: "6px",
                        height: "8px",
                        width: "100%",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${percent}%`,
                          background: "#3b82f6",
                          height: "100%"
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          
        ))
      )}


      {showModal && selectedTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%",
          height: "100%", backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "white", padding: "20px", borderRadius: "8px", width: "300px"
          }}>
            <h3 style={{ marginBottom: "10px", fontSize: "16px" }}>
              Add Subtask to: <br /><span style={{ color: "#0f172a" }}>{selectedTask.task}</span>
            </h3>

            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Subtask title"
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "6px 12px", background: "#f1f5f9", cursor:'pointer', border: "none", borderRadius: "4px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubtaskSubmit}
                disabled={isSubmitting}
                style={{
                  padding: "6px 12px",
                  background: isSubmitting ? "#93c5fd" : "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor:'pointer'
                }}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

        </div>
      )}


      {showStatusModal && selectedTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "#fff", padding: "20px", borderRadius: "8px", minWidth: "300px"
          }}>
            <h3 style={{ marginBottom: "10px" }}>Change Status</h3>
            <p>Mark "{selectedTask.task}" as <strong>In Progress</strong>?</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button
                onClick={async () => {
                  await updateTaskStatus(selectedTask.id, "In Progress");
                  setShowStatusModal(false);
                }}
              >
                Confirm
              </button>

            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default FetchTasks;
