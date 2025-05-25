import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTaskContext } from "../context/TaskContext";

const DeptTask = () => {
  const { tasks, loading, updateTaskChecked } = useTaskContext();
  const [projectCollapse, setProjectCollapse] = useState({});
  const [departmentCollapse, setDepartmentCollapse] = useState({});

  const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
  const username = loggedInUser?.username || "";

  // Find departments where the user has any assigned task
  const userDepartments = new Set(
    tasks
      .filter(task => task.assignedTo === username)
      .map(task => `${task.project}|||${task.department}`) // Combine for unique keys
  );

  // Group all tasks in departments the user is involved in
  const grouped = tasks.reduce((acc, task) => {
    const deptKey = `${task.project}|||${task.department}`;
    if (userDepartments.has(deptKey)) {
      if (!acc[task.project]) acc[task.project] = {};
      if (!acc[task.project][task.department]) acc[task.project][task.department] = [];
      acc[task.project][task.department].push(task);
    }
    return acc;
  }, {});

  const toggleProject = (project) => {
    setProjectCollapse((prev) => ({
      ...prev,
      [project]: !prev[project],
    }));
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

  if (loading) return <p>Loading tasks...</p>;

  if (Object.keys(grouped).length === 0) {
    return <p>You have no tasks assigned.</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h3>Tasks in Your Departments</h3>
      {Object.entries(grouped).map(([project, departments]) => (
        <div key={project} style={{ marginBottom: "20px", border: "1px solid #ddd", borderRadius: "8px", padding: "10px" }}>
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer", fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}
            onClick={() => toggleProject(project)}
          >
            {projectCollapse[project] ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
            <span style={{ marginLeft: "8px" }}>{project}</span>
          </div>

          {!projectCollapse[project] &&
            Object.entries(departments).map(([dept, deptTasks]) => {
              const key = `${project}-${dept}`;
              return (
                <div key={key} style={{ marginLeft: "20px", marginBottom: "15px" }}>
                  <div
                    onClick={() => toggleDepartment(project, dept)}
                    style={{ fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", fontSize: "16px", color: "#334155" }}
                  >
                    {departmentCollapse[key] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    <span style={{ marginLeft: "6px" }}>{dept}</span>
                  </div>

                  {!departmentCollapse[key] &&
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
                                gap: "10px"
                            }}
                            >
                            <div>
                                <strong>{task.task}</strong><br />
                                <small>Assigned to: {task.assignedTo || "Unassigned"}</small><br />
                                <small>Start: {task.startDate}</small> | <small>End: {task.endDate}</small><br />
                                <small>Status: {task.checked ? "✅ Completed" : "🕓 Pending"}</small>
                            </div>
                            </li>
                        ))}
                    </ul>

                  }
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
};

export default DeptTask;
