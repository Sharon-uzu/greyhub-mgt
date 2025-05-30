import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTaskContext } from "../context/TaskContext";
import { Supabase } from "../config/supabase-config";


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
const DeptTask = () => {
  const { tasks, loading, updateTaskChecked } = useTaskContext();
  const [projectCollapse, setProjectCollapse] = useState({});
  const [departmentCollapse, setDepartmentCollapse] = useState({});
  const [saving, setSaving] = useState(false); 
  const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
  const username = loggedInUser?.username || "";

  const userDepartments = new Set(
    tasks
      .filter((task) => task.assignedTo === username)
      .map((task) => `${task.project}|||${task.department}`)
  );

  const grouped = tasks.reduce((acc, task) => {
    const deptKey = `${task.project}|||${task.department}`;
    if (userDepartments.has(deptKey)) {
      if (!acc[task.project]) acc[task.project] = {};
      if (!acc[task.project][task.department])
        acc[task.project][task.department] = [];
      acc[task.project][task.department].push(task);
    }
    return acc;
  }, {});

  const toggleProject = (project) => {
    setProjectCollapse((prev) => ({
      ...prev,
      [project]: !prev[project],
    }));

    setDepartmentCollapse((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (key.startsWith(`${project}-`)) {
          delete newState[key];
        }
      });
      return newState;
    });
  };

  const toggleDepartment = (project, department) => {
    const key = `${project}-${department}`;
    setDepartmentCollapse((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCheckboxChange = async (taskId, currentChecked) => {
    const success = await updateTaskChecked(taskId, !currentChecked);
    if (!success) {
      alert("Failed to update task checkbox.");
    }
  };

  const [addNewTask, setAddNewTask] = useState(false);

  function AddTask() {
    setAddNewTask(!addNewTask);
  }

  const allowedCombos = Array.from(userDepartments).map((entry) => {
    const [project, department] = entry.split("|||");
    return { project, department };
  });

  const [newTask, setNewTask] = useState({
    project: "",
    department: "",
    task: "",
    startDate: "",
    endDate: "",
    color: "",
    progressColor: ""
  });

  const handleAddTask = async (e) => {
    e.preventDefault();
    setSaving(true); // Start loading
  
    const matchedTask = tasks.find(
      (task) =>
        task.project === newTask.project &&
        task.department === newTask.department
    );
  
    if (!matchedTask) {
      alert("Could not find matching project and department IDs.");
      setSaving(false); // Stop loading
      return;
    }
  
    const taskData = {
      ...newTask,
      assignedTo: username,
      checked: false,
      project_id: matchedTask.project_id,
      dept_id: matchedTask.dept_id,
    };
  
    try {
      const { error } = await Supabase.from("gantt-tasks").insert([taskData]);
  
      if (error) {
        console.error("Supabase error:", error);
        alert("Failed to add task.");
      } else {
        alert("Task added successfully.");
        setAddNewTask(false);
        setNewTask({
          project: "",
          department: "",
          task: "",
          startDate: "",
          endDate: "",
          color: "",
          progressColor: ""
        });
      }
    } catch (err) {
      console.error("Error adding task:", err);
      alert("An error occurred while adding the task.");
    }
  
    setSaving(false); // Stop loading
  };
  
  function formatDate(dateString) {
    const options = { day: "2-digit", month: "long", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }
  
  function getDurationInDays(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const timeDiff = endDate - startDate;
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // convert ms to days
  }
  
  

  if (loading) return <p>Loading tasks...</p>;

  if (Object.keys(grouped).length === 0) {
    return <p>You have no tasks assigned.</p>;
  }

  return (
    <div>
      <div className="flex-between" style={{ width: '93%', alignItems: 'center', margin: 'auto' }}>
        <h2>Department Tasks</h2>
        {/* <button className="icon-btn-sm" onClick={AddTask} style={{
          background: '#000',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px'
        }}>
          Add
        </button> */}
      </div>
      <div style={{ padding: "20px" }}>
        {Object.entries(grouped).map(([project, departments]) => (
          <div
            key={project}
            style={{
              marginBottom: "20px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "10px",
              }}
              onClick={() => toggleProject(project)}
            >
              {projectCollapse[project] ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              <span style={{ marginLeft: "8px" }}>{project}</span>
            </div>

            {projectCollapse[project] &&
              Object.entries(departments).map(([dept, deptTasks]) => {
                const key = `${project}-${dept}`;
                return (
                  <div key={key} style={{ marginLeft: "20px", marginBottom: "15px" }}>
                    <div
                      onClick={() => toggleDepartment(project, dept)}
                      style={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        fontSize: "16px",
                        color: "#334155",
                      }}
                    >
                      {departmentCollapse[key] ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                      <span style={{ marginLeft: "6px" }}>{dept}</span>
                    </div>

                    {departmentCollapse[key] && (
                      <ul style={{ marginLeft: "20px", marginTop: "5px" }}>
                        {deptTasks.map((task) => (
                          <li
                            key={task.id}
                            style={{
                              marginBottom: "8px",
                              background: "#f1f5f9",
                              padding: "8px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                            }}
                          >
                            <div>
                              
                              <strong>{task.task}</strong>
                              <br />
                              <small>
                                Assigned to: {task.assignedTo || "Unassigned"}
                              </small>
                              <br />
                              <small>
                                Start: {formatDate(task.startDate)} | End: {formatDate(task.endDate)}<br />
                                Duration: {getDurationInDays(task.startDate, task.endDate)} day{getDurationInDays(task.startDate, task.endDate) !== 1 ? "s" : ""}
                              </small>

                              <br />
                              <small>Status: <StatusLabel status={task.status} /></small>

                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {addNewTask && (
        <div className="taskmodal">
          <div className="task-form" style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: 1000,
            width: '300px'
          }}>
            <div className="task-form-c" style={{ textAlign: 'start' }}>
              <h3>Create New Task</h3>
              <form onSubmit={handleAddTask}>
                <label>Project</label>
                <select
                  value={newTask.project}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, project: e.target.value }))
                  }
                  required
                >
                  <option value="">Select</option>
                  {[...new Set(allowedCombos.map((c) => c.project))].map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>

                <label>Department</label>
                <select
                  value={newTask.department}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, department: e.target.value }))
                  }
                  required
                >
                  <option value="">Select</option>
                  {allowedCombos
                    .filter((c) => c.project === newTask.project)
                    .map((c, index) => (
                      <option key={index} value={c.department}>
                        {c.department}
                      </option>
                    ))}
                </select>

                <label>Task Name</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, task: e.target.value }))
                  }
                  required
                />

                <label>Start Date</label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  required
                />

                <label>End Date</label>
                <input
                  type="date"
                  value={newTask.endDate}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  required
                />

                <label>Task Color</label>
                <input
                  type="color"
                  value={newTask.color}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, color: e.target.value }))
                  }
                  required
                />

                <label>Progress Bar Color</label>
                <input
                  type="color"
                  value={newTask.progressColor}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, progressColor: e.target.value }))
                  }
                  required
                />

              <button
                type="submit"
                disabled={saving}
                style={{
                  background: saving ? "#334155" : "#1e293b",
                  color: "white",
                  padding: "10px 16px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: saving ? "not-allowed" : "pointer",
                  marginTop: "10px"
                }}
              >
                {saving ? "Saving..." : "Save Task"}
              </button>

                <button
                  type="button"
                  onClick={() => setAddNewTask(false)}
                  style={{
                    background: "#1e293b",
                    color: "white",
                    padding: "10px 16px",
                    border: "none",
                    marginTop: "10px",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptTask;
