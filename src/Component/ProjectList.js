import React, { useState, useEffect } from "react";
import { Supabase } from "../config/supabase-config";
import { MoreVertical } from "lucide-react";

const ProjectList = () => {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState("");
  const [groupedProjects, setGroupedProjects] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectMap, setProjectMap] = useState({});

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
  
             
            </div>
  
           
  
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

export default ProjectList;
