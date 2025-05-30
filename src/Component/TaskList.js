import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { useTaskContext } from "../context/TaskContext";
import { Supabase } from "../config/supabase-config";
import SubtaskList from "./SubtaskList";

// Format date helper
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

function getDurationInDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate - startDate;
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // convert ms to days
}
// Status component
const StatusLabel = ({ status }) => {
  let color = "#94a3b8"; // default gray
  let icon = "⏳";
  let label = "Pending";

  if (status === "In Progress") {
    color = "#3b82f6"; // blue
    icon = "🔄";
    label = "In Progress";
  } else if (status === "Completed") {
    color = "#10b981"; // green
    icon = "✅";
    label = "Completed";
  }

  return (
    <span style={{ color, fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "4px" }}>
      {icon} {label}
    </span>
  );
};

const GroupedTaskList = () => {
  const { tasks, loading, updateTaskChecked, fetchTasks, deleteTask } = useTaskContext();
  const [projectCollapse, setProjectCollapse] = useState({});
  const [openDepartmentKey, setOpenDepartmentKey] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({
    task: "",
    startDate: "",
    endDate: "",
    assignedTo: "",
  });

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await Supabase.from("gantt").select("username");
      if (error) {
        console.error("Error fetching usernames:", error);
        return;
      }
      const uniqueUsers = [...new Set(data.map((user) => user.username))];
      setUsers(uniqueUsers);
    };
    fetchUsers();
  }, []);

  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.project]) acc[task.project] = {};
    if (!acc[task.project][task.department]) acc[task.project][task.department] = [];
    acc[task.project][task.department].push(task);
    return acc;
  }, {});

  const toggleProject = (project) =>
    setProjectCollapse((prev) => ({ ...prev, [project]: !prev[project] }));

    const toggleDepartment = (project, department) => {
      const key = `${project}-${department}`;
      setOpenDepartmentKey(prevKey => (prevKey === key ? null : key));
    };
    

  const handleCheckboxChange = async (taskId, currentChecked) => {
    const success = await updateTaskChecked(taskId, !currentChecked);
    if (!success) alert("Failed to update task checkbox.");
  };

  if (loading) return <p>Loading tasks...</p>;

  if (!tasks || tasks.length === 0) {
    return (
      <div style={{ padding: "10px", color: "#64748b" }}>
        <p>No tasks found. Try adding a new task to get started!</p>
      </div>
    );
  }

  return (
    <div>
      {Object.entries(grouped).map(([project, departments]) => (
        <div key={project} style={{ marginBottom: "10px", marginTop: "10px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }} onClick={() => toggleProject(project)}>
            {projectCollapse[project] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            <span style={{ marginLeft: "8px", fontSize: "16px" }}>{project}</span>
          </div>

          {!projectCollapse[project] &&
            Object.entries(departments).map(([dept, deptTasks]) => {
              const key = `${project}-${dept}`;
              return (
                <div key={key} style={{ marginLeft: "20px", marginBottom: "15px" }}>
                  <div onClick={() => toggleDepartment(project, dept)} style={{ fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "16px", color: "#334155" }}>
                  {openDepartmentKey === key ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span style={{ marginLeft: "6px" }}>{dept}</span>
                  </div>

                  {openDepartmentKey === key &&  (
                    <ul style={{ marginLeft: "20px", marginTop: "5px" }}>
                      {deptTasks.map((task) => (
                        <li key={task.id} style={{ position: "relative", marginBottom: "8px", background: "#f1f5f9", padding: "8px", borderRadius: "6px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <input
                            type="checkbox"
                            checked={task.checked || false}
                            onChange={() => handleCheckboxChange(task.id, task.checked)}
                            style={{ marginTop: "4px" }}
                          />

                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "15px" }}>{task.task}</strong>
                            <br />
                            <small>Assigned to: {task.assignedTo || "Unassigned"}</small>
                            <br />
                            <small>
                                Start: {formatDate(task.startDate)} | End: {formatDate(task.endDate)}<br />
                                Duration: {getDurationInDays(task.startDate, task.endDate)} day{getDurationInDays(task.startDate, task.endDate) !== 1 ? "s" : ""}
                              </small>                            <br />
                            <small>Status: <StatusLabel status={task.status} /></small>
                          </div>

                          {/* 3-dot menu */}
                          <div style={{ position: "relative" }}>
                            <MoreVertical
                              size={18}
                              style={{ cursor: "pointer", marginTop: "5px" }}
                              onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                            />
                            {openMenuId === task.id && (
                              <div style={{ position: "absolute", right: 0, top: "20px", background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", borderRadius: "4px", zIndex: 10, minWidth: "120px" }}>
                                <div
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setEditForm({
                                      task: task.task,
                                      startDate: task.startDate,
                                      endDate: task.endDate,
                                      assignedTo: task.assignedTo || "",
                                    });
                                    setShowModal(true);
                                    setOpenMenuId(null);
                                  }}
                                  style={{ padding: "4px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "12px" }}
                                >
                                  ✏️ Edit Task
                                </div>
                                <div
                                  onClick={async () => {
                                    const confirmed = window.confirm("Are you sure you want to delete this task?");
                                    if (confirmed) {
                                      await deleteTask(task.id);
                                      setOpenMenuId(null);
                                    }
                                  }}
                                  style={{ padding: "4px", cursor: "pointer", color: "red", fontSize: "12px" }}
                                >
                                  🗑️ Delete Task
                                </div>
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

          {showModal && selectedTask && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }} onClick={() => setShowModal(false)}>
              <div style={{ background: "#fff", padding: 20, borderRadius: 8, minWidth: 300 }} onClick={(e) => e.stopPropagation()}>
                <h3>Edit Task</h3>
                <label>Task</label>
                <input type="text" value={editForm.task} onChange={(e) => setEditForm({ ...editForm, task: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
                <label>Start Date</label>
                <input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
                <label>End Date</label>
                <input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} style={{ width: "100%", marginBottom: 8 }} />
                <label>Assign User</label>
                <select value={editForm.assignedTo} onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })} style={{ width: "100%", marginBottom: 12 }}>
                  <option value="">-- Select User --</option>
                  {users.map((username) => (
                    <option key={username} value={username}>{username}</option>
                  ))}
                </select>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => setShowModal(false)}>Cancel</button>
                  <button
                    onClick={async () => {
                      try {
                        const { error: taskError } = await Supabase.from("gantt-tasks")
                          .update({
                            task: editForm.task,
                            startDate: editForm.startDate,
                            endDate: editForm.endDate,
                            assignedTo: editForm.assignedTo,
                          })
                          .eq("id", selectedTask.id);
                      
                        if (taskError) {
                          console.error("Task update failed:", taskError);
                          throw taskError;
                        }
                      
                        const { error: subtaskError } = await Supabase
                          .from("gantt-subtasks")
                          .update({
                            task: editForm.task,
                            // assignedTo: editForm.assignedTo,
                          })
                          .eq("task_id", selectedTask.id); // ✅ FIXED COLUMN NAME
                      
                        if (subtaskError) {
                          console.error("Subtask update failed:", subtaskError);
                          throw subtaskError;
                        }
                        alert('Update successful')
                        setShowModal(false);
                        fetchTasks();
                      } catch (err) {
                        console.error("Edit error:", err);
                        alert("Failed to update task.");
                      }
                      
                    }}
                  >
                    Save
                  </button>

                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default GroupedTaskList;
