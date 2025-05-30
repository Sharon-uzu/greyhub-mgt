import React, { useState, useEffect } from "react";
import { Supabase } from "../config/supabase-config";

const CreateDepartment = ({ addNewDepartment, setAddNewDepartment }) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [error, setError] = useState("");

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

  const closeDept = () => {
    setAddNewDepartment(false);
  };

  const handleProjectSelect = (e) => {
    const selectedId = e.target.value;
    setSelectedProjectId(selectedId);
    const selected = projects.find((proj) => proj.id.toString() === selectedId);
    if (selected) {
      setSelectedProjectName(selected.project);
    } else {
      setSelectedProjectName("");
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!departmentName.trim()) {
      setError("Department name is required.");
      return;
    }

    if (!selectedProjectId || !selectedProjectName) {
      setError("Please select a project.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await Supabase.from("gantt-depts").insert([
        {
          department: departmentName,
          project_id: selectedProjectId,
          project: selectedProjectName, // also store project name
        },
      ]);

      if (error) {
        console.error("Error inserting department:", error);
        setError("Failed to create department.");
      } else {
        alert("Department created successfully.");
        setAddNewDepartment(false);
        setDepartmentName("");
        setSelectedProjectId("");
        setSelectedProjectName("");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="task-form">
      <div className="task-form-c">
        <h3>Add New Department</h3>
        <input
          id="departmentName"
          type="text"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          disabled={loading}
          placeholder="Dept name"
        />

        <select
          id="projectSelect"
          value={selectedProjectId}
          onChange={handleProjectSelect}
          disabled={loading}
        >
          <option value="">-- Select a project --</option>
          {projects.map((proj) => (
            <option key={proj.id} value={proj.id}>
              {proj.project}
            </option>
          ))}
        </select>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading} onClick={handleDeptSubmit}>
          {loading ? "Creating..." : "Create Department"}
        </button>
        <button style={{ marginTop: "10px" }} type="button" onClick={closeDept}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateDepartment;
