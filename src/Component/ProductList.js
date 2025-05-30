import React, { useState, useEffect } from "react";
import { Supabase } from "../config/supabase-config";
import { MoreVertical } from "lucide-react";

const ProductList = () => {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState("");
  const [groupedProjects, setGroupedProjects] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [menuOpen, setMenuOpen] = useState(null);
  const [projectMap, setProjectMap] = useState({});
  const [deptMenuOpen, setDeptMenuOpen] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await Supabase.from("gantt-depts").select("*");
      if (error) {
        console.error("Error fetching departments:", error);
        setDepartments([]);
      } else {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchProjectsAndMap = async () => {
      const { data, error } = await Supabase.from("gantt-projects").select("id, project");
      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      setProjects(data);
      const map = {};
      data.forEach((p) => {
        map[p.project] = p.id;
      });
      setProjectMap(map);
      if (data.length > 0) setActiveProject(data[0].project);
    };

    fetchProjectsAndMap();
  }, []);

  useEffect(() => {
    const grouped = departments.reduce((acc, dept) => {
      const { project, department, id } = dept;
      if (!acc[project]) {
        acc[project] = [];
      }
      acc[project].push({ department, id });
      return acc;
    }, {});
    setGroupedProjects(grouped);
  }, [departments]);

  const toggleProject = (projectName) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectName]: !prev[projectName],
    }));
  };

  const handleProjectClick = (projectName) => {
    setActiveProject(projectName);
    localStorage.setItem("activeProject", projectName);
  };

  const handleEditProject = async (oldProjectName) => {
    const newProjectName = prompt(`Enter new name for "${oldProjectName}":`, oldProjectName);
    if (!newProjectName || newProjectName === oldProjectName) return;
  
    const projectId = projectMap[oldProjectName];
    if (!projectId) {
      alert("Project ID not found.");
      return;
    }
  
    try {
      // 1. Update gantt-projects
      const { error: projError } = await Supabase
        .from("gantt-projects")
        .update({ project: newProjectName })
        .eq("id", projectId);
  
      // 2. Update gantt-depts
      const { error: deptError } = await Supabase
        .from("gantt-depts")
        .update({ project: newProjectName })
        .eq("project_id", projectId);
  
      // 3. Update gantt-tasks
      const { error: taskError } = await Supabase
        .from("gantt-tasks")
        .update({ project: newProjectName })
        .eq("project_id", projectId);

        // 3. Update gantt-subtasks
        const { error: subtaskError } = await Supabase
        .from("gantt-subtasks")
        .update({ project: newProjectName })
        .eq("project_id", projectId);

  
      if (projError || deptError || taskError) {
        console.error({ projError, deptError, taskError });
        alert("Error updating project name. See console for details.");
      } else {
        alert("Project name updated successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error during update:", err);
      alert("Something went wrong while editing the project.");
    }
  };

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await Supabase.from("gantt-projects").select("id, project");
      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }
  
      setProjects(data);
  
      const map = {};
      data.forEach((p) => {
        map[p.project] = p.id;
      });
      setProjectMap(map);
    }
  
    fetchProjects();
  }, []);
  

  const handleDeleteProject = async (projectName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${projectName}" and all related data?`
    );
    if (!confirmDelete) return;

    const projectId = projectMap[projectName];
    if (!projectId) {
      alert("Project ID not found.");
      return;
    }

    try {
      const { error: subtaskError } = await Supabase.from("gantt-subtasks").delete().eq("project_id", projectId);
      const { error: taskError } = await Supabase.from("gantt-tasks").delete().eq("project_id", projectId);
      const { error: deptError } = await Supabase.from("gantt-depts").delete().eq("project_id", projectId);
      const { error: projError } = await Supabase.from("gantt-projects").delete().eq("id", projectId);

      if (taskError || deptError || projError || subtaskError) {
        console.error({ taskError, deptError, projError });
        alert("Failed to delete project data.");
      } else {
        alert("Project and related data deleted successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong.");
    }
  };

  const handleEditDepartment = async (deptId, oldName) => {
    const newName = prompt(`Enter new name for "${oldName}":`, oldName);
    if (!newName || newName === oldName) return;
  
    try {
      // 1. Update department name in gantt-depts
      const { error: deptError } = await Supabase
        .from("gantt-depts")
        .update({ department: newName })
        .eq("id", deptId);
  
      // 2. Update related tasks with the new department name
      const { error: taskError } = await Supabase
        .from("gantt-tasks")
        .update({ department: newName })
        .eq("dept_id", deptId);

      // 3. Update related subtasks with the new department name
      const { error: subtaskError } = await Supabase
      .from("gantt-subtasks")
      .update({ department: newName })
      .eq("dept_id", deptId);

  
      if (deptError || taskError || subtaskError) {
        console.error({ deptError, taskError, subtaskError });
        alert("Failed to update department. See console for details.");
      } else {
        alert("Department and related tasks updated successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error editing department:", err);
      alert("Something went wrong.");
    }
  };
  
  
  const handleDeleteDepartment = async (deptId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this department and all related tasks?");
    if (!confirmDelete) return;
  
    try {
      // 1. Delete related tasks
      const { error: taskError } = await Supabase
        .from("gantt-tasks")
        .delete()
        .eq("dept_id", deptId);
        
      // 2. Delete related tasks
      const { error: subtaskError } = await Supabase
      .from("gantt-subtasks")
      .delete()
      .eq("dept_id", deptId);
  
      // 3. Delete the department itself
      const { error: deptError } = await Supabase
        .from("gantt-depts")
        .delete()
        .eq("id", deptId);
  
      if (taskError || deptError || subtaskError) {
        console.error({ taskError, deptError });
        alert("Failed to delete department or related tasks. Check console for details.");
      } else {
        alert("Department and related tasks deleted successfully.");
        window.location.reload();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong during deletion.");
    }
  };
  
  

  return (
    <div>
      {projects.map(({ project }) => {
        const depts = groupedProjects[project] || [];
        return (
          <div key={project} style={{ position: "relative", marginBottom: "20px"}}>
            <div
              className={`project ${activeProject === project ? "active" : ""}`}
              onClick={() => {
                toggleProject(project);
                handleProjectClick(project);
              }}
              style={{
                cursor: "pointer",
                backgroundColor: activeProject === project ? "#1e293b" : "#f1f5f9",
                color: activeProject === project ? "white" : "black",
                padding: "10px",
                borderRadius: "6px",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{expandedProjects[project] ? "▼" : "▶"}</span>
                <span>{project}</span>
              </div>
  
              <MoreVertical
                size={18}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === project ? null : project);
                }}
                style={{ cursor: "pointer" }}
              />
            </div>
  
            {menuOpen === project && (
              <div
                style={{
                  position: "absolute",
                  top: "45px",
                  right: "10px",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  zIndex: 10,
                }}
              >
                <div
                  onClick={() => handleEditProject(project)}
                  style={{ padding: "8px 16px", cursor: "pointer" }}
                >
                  Edit
                </div>
                <div
                  onClick={() => handleDeleteProject(project)}
                  style={{ padding: "8px 16px", cursor: "pointer", color: "red" }}
                >
                  Delete
                </div>
              </div>
            )}
  
            {expandedProjects[project] && (
              <ul style={{ marginLeft: "30px", marginTop: "5px", color: "#888", listStyle:'none'}}>
                {depts.length > 0 ? (
                  depts.map(({ department, id }) => (
                    <li
                    key={id}
                    style={{
                        backgroundColor: "#c7dff1",
                        padding: "6px",
                        borderRadius: "8px",
                        color: "#000",
                        marginBottom: "8px",
                        fontWeight:500,
                        fontSize:'15px',
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        position: "relative",
                    }}
                    >
                    <span>{department}</span>
                    <MoreVertical
                        size={16}
                        onClick={(e) => {
                        e.stopPropagation();
                        setDeptMenuOpen(deptMenuOpen === id ? null : id);
                        }}
                        style={{ cursor: "pointer" }}
                    />

                    {deptMenuOpen === id && (
                        <div
                        style={{
                            position: "absolute",
                            top: "30px",
                            right: "0px",
                            backgroundColor: "white",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                            zIndex: 10,
                        }}
                        >
                        <div
                            onClick={() => handleEditDepartment(id, department)}
                            style={{ padding: "8px 16px", cursor: "pointer" }}
                        >
                            Edit
                        </div>
                        <div
                            onClick={() => handleDeleteDepartment(id)}
                            style={{ padding: "8px 16px", cursor: "pointer", color: "red" }}
                        >
                            Delete
                        </div>
                        </div>
                    )}
                    </li>
                  ))
                ) : (
                  <li style={{ fontStyle: "italic", color: "#888", fontWeight:500 }}>No department created yet</li>
                )}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
  
};

export default ProductList;
