// FetchTasks.jsx
import { useState, useEffect } from "react";
import { useTaskContext } from "../context/TaskContext";

const FetchTasks = () => {
  const { tasks, loading, updateTaskChecked } = useTaskContext();
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Get the logged-in user from local storage
    const storedUser = JSON.parse(localStorage.getItem("ganttUser"));
    if (storedUser?.username) {
      setUsername(storedUser.username);
    }
  }, []);

  // Filter tasks for the current user
  const userTasks = tasks.filter(task => task.assignedTo === username);

  const groupedByProject = userTasks.reduce((acc, task) => {
    const project = task.project || "No Project";
    if (!acc[project]) acc[project] = [];
    acc[project].push(task);
    return acc;
  }, {});

  const toggleProjectCollapse = (project) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [project]: !prev[project],
    }));
  };

  const toggleChecked = async (taskId, currentChecked) => {
    const success = await updateTaskChecked(taskId, !currentChecked);
    if (!success) {
      alert("Failed to update task checkbox.");
    }
  };

  if (!username) return <p>Loading user info...</p>;
  if (loading) return <p>Loading tasks...</p>;

  return (
    <div>
      <h3 style={{ marginBottom: "10px", fontSize:'17px' }}>Tasks for <strong>{username}</strong></h3>

      {Object.keys(groupedByProject).length === 0 ? (
        <p>No tasks assigned to {username}.</p>
      ) : (
        Object.entries(groupedByProject).map(([project, tasksInProject]) => (
          <div key={project} style={{ marginBottom: "20px" }}>
            <div
              onClick={() => toggleProjectCollapse(project)}
              style={{
                cursor: "pointer",
                background: "#f1f5f9",
                padding: "10px",
                fontWeight: 600,
                borderRadius: "6px",
                marginBottom: "10px",
                fontSize:'15px'
              }}
            >
              {collapsedProjects[project] ? "▶" : "▼"} {project}
            </div>

            {!collapsedProjects[project] && (
              <ul style={{ listStyle: "none", paddingLeft: "15px" }}>
                {tasksInProject.map((task) => (
                  <li
                    key={task.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "10px",
                      borderBottom: "1px solid #e2e8f0",
                      paddingBottom: "6px",
                    }}
                  >
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={task.checked || false}
                        onChange={() => toggleChecked(task.id, task.checked)}
                      />

                      <span style={{ textDecoration: task.checked ? "line-through" : "none", color: "#334155", fontSize:'15px', fontWeight:500 }}>
                        {task.task}({task.department})
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default FetchTasks;