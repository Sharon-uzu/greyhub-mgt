import React, { useEffect, useState } from "react";
import "gantt-task-react/dist/index.css";
import { Supabase } from "../config/supabase-config";
import { TaskProvider } from '../context/TaskContext';
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";


import {
    PlusCircle,
    Users,
    
  } from "lucide-react";
  
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import CreateTask from "../Component/CreateTask";
import CreateDepartment from "../Component/CreateDepartment";
import TaskList from "../Component/TaskList";
import FetchTasks from "../Component/FetchTasks";
import GanttWithProgress from "../Component/GanttWithProgress";

const initialTasks = [

];


const Main = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(initialTasks);
    const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
    const username = loggedInUser?.username || "";
    console.log(username)


  const [activeProject, setActiveProject] = useState("Ziphabot");
    const [addNewTask, setAddNewTask] = useState(false)

    function AddTask(){
        setAddNewTask(!addNewTask)
    }

    const [isZoomed, setIsZoomed] = useState(false);

    const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
    };


    const [addNewDepartment, setAddNewDepartment] = useState(false)

    function AddDepartment(){
        setAddNewDepartment(!addNewDepartment)
    }

    const [addNewUser, setAddNewUser] = useState(false)

    function AddUser(){
        setAddNewUser(!addNewUser)
    }

    const [addNewProject, setAddNewProject] = useState(false)

    function AddProject(){
        setAddNewProject(!addNewProject)
    }

    const handleLogout = () => {
      localStorage.removeItem("ganttUser"); 
      localStorage.removeItem("activatedProject"); // Optional: clear any other session data
      navigate("/");  
    };
    
 
    
  const initialValues = {
    fullname: "",
    username: "",
    password: "",
    role: "user",
    status:"active"
  };
  const [formData, setFormData] = useState(initialValues);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = (values) => {
    const errors = {};
  
    if (!values.fullname) errors.fullname = "Full name is required";
    if (!values.username) errors.username = "Username is required";
    if (!values.password) errors.password = "Password is required";
  
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const errors = validate(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
  
    try {
      setLoading(true);
  
      // Check for existing user with same username or fullname
      const { data: existingUsers, error: checkError } = await Supabase
        .from("gantt")
        .select("id")
        .or(`username.eq.${formData.username},fullname.eq.${formData.fullname}`);
  
      if (checkError) {
        console.error("Check error:", checkError);
        alert("Failed to check for existing users.");
        setLoading(false);
        return;
      }
  
      if (existingUsers.length > 0) {
        alert("Username or Fullname already exists. Please use a different one.");
        setLoading(false);
        return;
      }
  
      // Proceed with insertion
      const { data, error } = await Supabase.from("gantt").insert([formData]);
  
      if (error) {
        console.error("Insert error:", error);
        alert("Failed to create user.");
      } else {
        alert("User created successfully.");
        setFormData(initialValues); // reset form
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const [project, setProject] = useState("");
  const [error, setError] = useState("");

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!project.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await Supabase.from("gantt-projects").insert([{ project }]);

      if (error) {
        setError("Failed to create project");
        console.error(error);
      } else {
        alert("Project created successfully");
        setProject(""); // reset input
      }
    } catch (err) {
      setError("Unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [projects, setProjects] = useState([]);
  const [activatedProject, setActivatedProject] = useState(() => {
    return localStorage.getItem("activeProject") || "";
  });


  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await Supabase.from("gantt-projects").select("project");

      if (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } else {
        const stored = localStorage.getItem("activatedProject");
        const projectsData = data || [];

        setProjects(projectsData);

        // If no project is saved, use the first one
        if (!stored && projectsData.length > 0) {
          const firstProject = projectsData[0].project;
          setActivatedProject(firstProject);
          localStorage.setItem("activatedProject", firstProject);
        } else {
          setActivatedProject(stored);
        }
      }
      setLoading(false);
    }

    fetchProjects();
  }, []);

  const handleProjectClick = (project) => {
    setActivatedProject(project);
    localStorage.setItem("activProject", project);
  };

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
  

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await Supabase
        .from("gantt-tasks")
        .select("*")
        .eq("assignedTo", username);

      if (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
      } else {
        setTasks(data);
      }
      setLoading(false);
    };

    if (username) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [username]);

  const [usernames, setUsernames] = useState("");



  const [users, setUsers] = useState([]);

  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await Supabase
      .from("gantt")
      .select("id, username, role, status");

    if (!error) setUsers(data);
    setLoading(false);
  };

  const toggleSuspend = async (id, currentStatus) => {
    setUpdatingUserId(id);
    const { error } = await Supabase
      .from("gantt")
      .update({ status: currentStatus === "active" ? "suspended" : "active" })
      .eq("id", id);

    if (!error) fetchUsers();
    setUpdatingUserId(null);
  };

  const updateRole = async (id, newRole) => {
    setUpdatingUserId(id);
    const { error } = await Supabase
      .from("gantt")
      .update({ role: newRole })
      .eq("id", id);

    if (!error) fetchUsers();
    setUpdatingUserId(null);
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("ganttUser"));
    if (storedUser?.usernames) {
      setUsernames(storedUser.usernames);
    }
  }, []);
  
  


  
    return (
      <TaskProvider>
        <div>
            <div className="card full-span flex-between" style={{
              background: '#000',
              color: 'white',
              padding: '20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
                <h1 className="title-xl">GreyHub Management Dashboard</h1>
                <div className="flex gap">
                <button className="btn-primary" onClick={AddDepartment}>Create Departments</button>
                <button className="btn-outline" onClick={AddUser}>Create Users</button>
                </div>
            </div>
            <div className="admin-logout" onClick={handleLogout} style={{ cursor: "pointer" }}>
              <FiLogOut />
              <h4>LogOut</h4>
            </div>
        </div>
        <div className="container">
            <div className="container-c">

            <div className={`main-s ${isZoomed ? "zoom-mode" : ""}`}>
                
                <div className={`gantt ${isZoomed ? "fullscreen-gantt" : ""}`}>
                    <div className="z-btn">
                    <h3>GANTT</h3>
                    <button className="zoom" onClick={toggleZoom}>
                        {isZoomed ? "EXIT ZOOM" : "ZOOM VIEW"}
                    </button>
                    </div>
                    <GanttWithProgress/>
                </div>
                

                {!isZoomed && (
                    <aside className="sidebar card">
                        <div className="flex-between mb">
                            <h3 className="title-md" style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1e293b' }}>Projects</h3>
                            <button style={{
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
                                }} className="icon-btn-sm" onClick={AddProject}>
                                <PlusCircle className="icon" /> Add
                            </button>
                        </div>
                    
                        {loading ? (
                          <p>Loading projects...</p>
                        ) : projects.length === 0 ? (
                          <p>No projects created yet.</p>
                        ) : (
                          projects.map(({ project }) => (
                            <h4
                              key={project}
                              className={`project ${activeProject === project ? "active" : ""}`}
                              onClick={() => handleProjectClick(project)}
                              style={{
                                cursor: "pointer",
                                backgroundColor: activeProject === project ? "#1e293b" : "#f1f5f9",
                                color: activeProject === project ? "white" : "black",
                                padding: "10px",
                                borderRadius: "6px",
                                marginBottom: "6px",
                              }}
                            >
                              {project}
                            </h4>
                          ))
                        )}

                    
                    </aside>
                )}
            </div>
                <br />

                <div className="aside-section">
                    <aside className="sidebar card">
                    <div className="flex-between mb">
                        <h3 className="title-md">Tasks Checklist</h3>
                        <button className="icon-btn-sm" onClick={AddTask} style={{
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
                            <PlusCircle className="icon" /> Add
                        </button>
                    </div>
                      <TaskList/>

                    {
                        addNewTask ? (<>

                        <div className="taskmodal" >
                        
                          <CreateTask addNewTask={addNewTask} setAddNewTask={setAddNewTask}/>

                        </div>
                        </>) : null
                    }


                    {
                        addNewDepartment ? (<>

                        <div className="taskmodal">
                        
                          <CreateDepartment addNewDepartment={addNewDepartment} setAddNewDepartment={setAddNewDepartment}/>

                        </div>
                        </>) : null
                    }


                    {
                        addNewUser ? (<>

                        <div className="taskmodal">
                        
                            
                            <div className="admin-container">
                              <div className="admin-card">

                                <div className="tab-content">
                                  <h2>Create User</h2><br />
                                  
                                  <div>
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                      type="text"
                                      name="fullname"
                                      placeholder="Full Name"
                                      value={formData.fullname}
                                      onChange={handleChange}
                                    />                                  
                                  </div>
                                  <div>
                                    <label htmlFor="username">Username</label>
                                    <input
                                      type="text"
                                      name="username"
                                      placeholder="Username"
                                      value={formData.username}
                                      onChange={handleChange}
                                    />
                                  </div>

                                  <div>
                                    <label htmlFor="username">Role</label>
                                    <select name="role" value={formData.role} onChange={handleChange}>
                                      <option value="user">User</option>
                                      <option value="admin">Admin</option>
                                      <option value="subadmin">Sub Admin</option>
                                    </select>
                                  </div>
                                  
                                  <div>
                                    <label htmlFor="password">Password</label>
                                    <input
                                      type="password"
                                      name="password"
                                      placeholder="Password"
                                      value={formData.password}
                                      onChange={handleChange}
                                    />
                                  </div>
                                  <button className="save-button" onClick={handleSubmit}
                                    disabled={loading}
                                    style={{
                                      padding: "10px 20px",
                                      backgroundColor: loading ? "#aaa" : "#333",
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: loading ? "not-allowed" : "pointer",
                                      opacity: loading ? 0.7 : 1,
                                    }}>{loading ? "Saving..." : "Save"}
                                  </button>
                                  <button type='button' className="save-button" style={{marginLeft:'8px'}} onClick={AddUser}>Cancel</button>
                                </div>

                                
                              </div>
                            </div>
                        </div>
                        </>) : null
                    }

                    {
                        addNewProject ? (<>

                        <div className="taskmodal" onClick={AddProject}>
                        
                            <form className="task-form" onClick={(e) => e.stopPropagation()}>
                                <div className="task-form-c">
                                    <h3>Add New Project</h3>
                                    <input
                                    type="text"
                                    placeholder="Project Name"
                                    value={project}
                                    onChange={(e) => setProject(e.target.value)}
                                    disabled={loading}
                                    />
                                    {error && <p style={{ color: "red" }}>{error}</p>}

                                    <button type="submit" disabled={loading} onClick={handleProjectSubmit}>{loading ? "Creating..." : "Create Project"}</button>
                                </div>
                            </form>

                        </div>
                        </>) : null
                    }
            
                    
                    </aside>

                    {/* <div className="sidebar card">
                        <div className="flex gap mb">
                        <BarChart2 className="icon-blue" />
                        <h3 className="title-md">Analytics</h3>
                        </div>
                        <p className="text-sm">
                        Overview of progress across departments and tasks.
                        </p>


                        
                    </div> */}

                    <aside className="sidebar card">
                      <div className="flex-between mb">
                        <h3 className="title-md">Personal Checklist</h3>
                      </div>
                      <FetchTasks/>
                    </aside>


                    <div className="sidebar card">
                        <div className="flex gap mb">
                        <Users className="icon-purple" />
                        <h3 className="title-md">User Management</h3>
                        </div>
                        <p className="text-sm">
                        Add users, assign roles, and manage department access.
                        </p>
                        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                          <thead>
                            <tr style={{ background: "#f1f5f9" }}>
                              <th style={{ padding: "8px", border: "1px solid #ccc" }}>Username</th>
                              <th style={{ padding: "8px", border: "1px solid #ccc" }}>Role</th>
                              <th style={{ padding: "8px", border: "1px solid #ccc" }}>Status</th>
                              <th style={{ padding: "8px", border: "1px solid #ccc" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id}>
                                <td style={{ padding: "8px", border: "1px solid #eee" }}>{user.username}</td>
                                <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                  <select
                                    value={user.role}
                                    onChange={(e) => updateRole(user.id, e.target.value)}
                                    disabled={updatingUserId === user.id}
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="subadmin">Sub Admin</option>
                                  </select>
                                </td>
                                <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                  {user.status}
                                </td>
                                <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                  <button
                                    onClick={() => toggleSuspend(user.id, user.status)}
                                    disabled={updatingUserId === user.id}
                                    style={{
                                      padding: "5px 10px",
                                      backgroundColor: user.status === "active" ? "#f87171" : "#4ade80",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {user.status === "active" ? "Suspend" : "Unsuspend"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
      </TaskProvider>
  )
}

export default Main