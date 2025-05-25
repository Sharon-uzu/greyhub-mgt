import React, {useState, useEffect} from 'react'
import { Supabase } from "../config/supabase-config";

const CreateDepartment = ({addNewDepartment, setAddNewDepartment}) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [departmentName, setDepartmentName] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await Supabase.from("gantt-projects").select("project");
      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        setProjects(data);
      }
    };

    fetchProjects();
  }, []);

  function closeDept(){
    setAddNewDepartment(false)
  }

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!departmentName.trim()) {
      setError("Department name is required.");
      return;
    }
    if (!selectedProject) {
      setError("Please select a project.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await Supabase.from("gantt-depts").insert([
        {
          department: departmentName,
          project: selectedProject, // Storing project name directly
        },
      ]);

      if (error) {
        console.error("Error inserting department:", error);
        setError("Failed to create department.");
      } else {
        alert("Department created successfully.");
        setAddNewDepartment(false)
        setDepartmentName("");
        setSelectedProject("");
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
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={loading}
                >
                <option value="">-- Select a project --</option>
                {projects.map((proj, index) => (
                    <option key={index} value={proj.project}>
                    {proj.project}
                    </option>
                ))}
                </select>
            
                {error && <p style={{ color: "red" }}>{error}</p>}

            
                <button type="submit" disabled={loading} onClick={handleDeptSubmit}>
                {loading ? "Creating..." : "Create Department"}
                </button>
                <button style={{marginTop:'10px'}} type="button" onClick={closeDept}>Cancel</button>
        </div>
    </form>
  )
}

export default CreateDepartment