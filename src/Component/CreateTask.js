import React, { useEffect, useState } from "react";
import { Supabase } from "../config/supabase-config";

const CreateTask = ({ addNewTask, setAddNewTask }) => {
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDeptName, setSelectedDeptName] = useState("");
  const [taskName, setTaskName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await Supabase.from("gantt").select("username");
      if (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } else {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  function closeTask() {
    setAddNewTask(false);
  }

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await Supabase.from("gantt-projects").select("id, project");
      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        setProjects(data);
      }
    };
    fetchProjects();
  }, []);

  // Fetch departments for selected project
  useEffect(() => {
    if (!selectedProjectId) {
      setDepartments([]);
      return;
    }
    const fetchDepartments = async () => {
      const { data, error } = await Supabase
        .from("gantt-depts")
        .select("id, department")
        .eq("project_id", selectedProjectId);
      if (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      } else {
        setDepartments(data);
      }
    };
    fetchDepartments();
  }, [selectedProjectId]);

  const [color, setColor] = useState("#00bcd4"); 
  const [progressColor, setProgressColor] = useState("#4caf50");



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedProjectId || !selectedDeptId || !taskName.trim() || !startDate || !endDate) {
      setError("All fields are required.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setCreating(true);
      const { error } = await Supabase.from("gantt-tasks").insert([
        {
          task: taskName,
          startDate,
          endDate,
          assignedTo,
          checked: false,
          project_id: selectedProjectId,
          project: selectedProjectName,
          dept_id: selectedDeptId,
          department: selectedDeptName,
          status:'Pending',
          color, 
          progressColor,
        },
      ]);

      if (error) {
        console.error("Error creating task:", error);
        setError("Failed to create task.");
      } else {
        alert("Task created successfully.");
        setAddNewTask(false);
        setTaskName("");
        setStartDate("");
        setEndDate("");
        setAssignedTo("");
        setSelectedProjectId("");
        setSelectedDeptId("");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <form className="task-form" style={{ padding: "20px", borderRadius: "12px", background: "#f9f9f9" }}>
      <div className="task-form-c">
        <h3>Create Task</h3>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Project</label>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedProjectId(id);
              const selected = projects.find((p) => p.id.toString() === id);
              setSelectedProjectName(selected?.project || "");
              setSelectedDeptId("");
              setSelectedDeptName("");
            }}
          >
            <option value="">-- Select Project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Department</label>
          <select
            value={selectedDeptId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedDeptId(id);
              const selected = departments.find((d) => d.id.toString() === id);
              setSelectedDeptName(selected?.department || "");
            }}
            disabled={!selectedProjectId}
          >
            <option value="">-- Select Department --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
          />
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Assigned To</label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">-- Select User --</option>
            {users.map((user, idx) => (
              <option key={idx} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "10px", textAlign: "start" }}>
          <label>Task Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <label htmlFor="progressColor">Progress Bar Color</label>
          <input
            type="color"
            id="progressColor"
            name="progressColor"
            value={progressColor}
            onChange={(e) => setProgressColor(e.target.value)}
          />



        {error && <p style={{ color: "red", textAlign: "start" }}>{error}</p>}

        <button
          type="submit"
          onClick={handleSubmit}
          disabled={creating}
          style={{
            background: creating ? "#ccc" : "#1e293b",
            color: "white",
            padding: "10px 16px",
            border: "none",
            borderRadius: "8px",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create Task"}
        </button>
        <button
          type="button"
          onClick={closeTask}
          style={{
            background: creating ? "#ccc" : "#1e293b",
            color: "white",
            padding: "10px 16px",
            border: "none",
            marginTop: "10px",
            borderRadius: "8px",
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateTask;
