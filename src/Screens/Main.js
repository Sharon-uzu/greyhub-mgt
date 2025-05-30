import React, { useEffect, useState } from "react";
import "gantt-task-react/dist/index.css";
import { Supabase } from "../config/supabase-config";
import { TaskProvider } from '../context/TaskContext';
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { FaCircleUser } from "react-icons/fa6";
import { Link } from "react-router-dom";


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
import ProductList from "../Component/ProductList";
import PersonalProjects from "../Component/PersonalProjects";

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
        setAddNewUser(!addNewUser)
        window.location.reload();

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
        setAddNewProject(!addNewProject)
        window.location.reload();
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
    .select("id, username, fullname, role, status");

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

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (!confirmDelete) return;
  
    setUpdatingUserId(id);
  
    const { error } = await Supabase
      .from("gantt")
      .delete()
      .eq("id", id);
  
    if (error) {
      console.error("Delete failed:", error);
    } else {
      fetchUsers();
    }
  
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
  
  
  const [openMenuId, setOpenMenuId] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [formDatas, setFormDatas] = useState({
  username: "",
  fullname: "",
  password: ""
  });
  
  const [saving, setSaving] = useState(false);


  const editUserHandler = (user) => {
    setEditUser(user);
    setFormDatas({
      username: user.username || "",
      fullname: user.fullname || "",
      password: ""
    });
  };
  

    const saveEditHandler = async () => {
      if (!editUser) return;

      setSaving(true);
      setUpdatingUserId(editUser.id);
      
      const updates = {
      username: formDatas.username,
      fullname: formDatas.fullname
      };
      
      if (formDatas.password.trim() !== "") {
      updates.password = formDatas.password;
      }
      
      const { error } = await Supabase
      .from("gantt")
      .update(updates)
      .eq("id", editUser.id);
      
      if (!error) {
        await fetchUsers();
        setEditUser(null);
        alert("User updated successfully ✅");
      } else {
        alert("Update failed ❌");
      }
      setSaving(false);
      setUpdatingUserId(null);
      };


      
      
  
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
                <div className="flex gap" style={{alignItems:'center'}}>
                <Link to='/project' style={{cursor:'pointer', textDecoration:'none', fontSize:'26px', color:'#fff', marginTop:'5px'}}><FaCircleUser /></Link>

                <button className="btn-primary" onClick={AddProject}>Create Projects</button>
                {/* <button className="btn-outline" onClick={AddUser}>Create Users</button> */}
                </div>
            </div>
            <div className="admin-logout">
              <h4 style={{fontSize:'18px',color:'#fff', fontWeight:600, marginRight:"9px"}}>{username}</h4>
              <div  onClick={handleLogout} style={{ cursor: "pointer", display:'flex', alignItems:'center', gap:'8px', color:'#fff' }}>
                <FiLogOut />
                <h4 style={{color:'#fff'}}>LogOut</h4>
              </div>
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
                    <div className="gantt-scroll">

                      <GanttWithProgress/>
                    </div>
                    
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
                                }} className="icon-btn-sm" onClick={AddDepartment}>
                                <PlusCircle className="icon" /> Add Dept
                            </button>
                        </div>
                    
                        <div className="task-scroll">
                        <ProductList/>
                        
                        </div>
                        

                    
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
                    <h3 style={{ fontSize: "16px" }}>All Tasks</h3>

                    <div className="task-scroll" style={{marginTop:'15px'}}>
                      <TaskList/>
                      
                    </div>
                      

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
                      <h3 style={{ marginBottom: "10px", fontSize: '17px' }}>
                          Tasks for <strong>{username}</strong>
                      </h3>

                      <div className="task-scroll">
                        <FetchTasks/>
                      </div>
                      
                      
                    </aside>


                    <div className="sidebar card">
                        <div style={{display:'flex', justifyContent:'end', marginBottom:'10px'}}>
                          <button className="btn-outline" onClick={AddUser}>Create Users</button>

                        </div>
                        <div className="flex gap mb">
                          
                        <Users className="icon-purple" />

                        <h3 className="title-md">User Management</h3>
                        </div>
                        <p className="text-sm">
                        Add users, assign roles, and manage department access.
                        </p>
                        <div className="table">
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
                                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                      {user.role === "admin" ? (
                                        <span>Admin</span>
                                      ) : (
                                        <select
                                          value={user.role}
                                          onChange={(e) => updateRole(user.id, e.target.value)}
                                          disabled={updatingUserId === user.id}
                                        >
                                          <option value="user">User</option>
                                          <option value="subadmin">Sub Admin</option>
                                        </select>
                                      )}
                                    </td>

                                    </td>
                                    <td style={{ padding: "8px", border: "1px solid #eee" }}>
                                      {user.status}
                                    </td>
                                    {/* <td style={{ padding: "8px", border: "1px solid #eee" }}>
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
                                    </td> */}
                                    <td style={{ padding: "8px", border: "1px solid #eee", position: "relative" }}> <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }} > ⋮ </button>
                                    {openMenuId === user.id && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: "30px",
                                          right: "0",
                                          background: "#fff",
                                          border: "1px solid #ccc",
                                          borderRadius: "4px",
                                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                                          zIndex: 1000,
                                          width: "120px",
                                        }}
                                      >
                                        {/* Only show Suspend/Unsuspend and Delete if not admin */}
                                        {user.role !== "admin" && (
                                          <>
                                            <div
                                              onClick={() => {
                                                toggleSuspend(user.id, user.status);
                                                setOpenMenuId(null);
                                              }}
                                              style={{
                                                fontSize: "13px",
                                                padding: "8px",
                                                cursor: "pointer",
                                                borderBottom: "1px solid #eee",
                                                color: user.status === "active" ? "#f87171" : "#4ade80",
                                              }}
                                            >
                                              {user.status === "active" ? "Suspend" : "Unsuspend"}
                                            </div>
                                          </>
                                        )}

                                        <div
                                          onClick={() => editUserHandler(user)}
                                          style={{
                                            fontSize: "13px",
                                            padding: "8px",
                                            cursor: "pointer",
                                            color: "#5e5e5e",
                                            borderBottom: user.role !== "admin" ? "1px solid #eee" : "none",
                                          }}
                                        >
                                          Edit
                                        </div>

                                        {/* Only show Delete if not admin */}
                                        {user.role !== "admin" && (
                                          <div
                                            onClick={() => {
                                              deleteUser(user.id);
                                              setOpenMenuId(null);
                                            }}
                                            style={{
                                              fontSize: "13px",
                                              padding: "8px",
                                              cursor: "pointer",
                                              color: "#ef4444",
                                            }}
                                          >
                                            Delete
                                          </div>
                                        )}
                                      </div>
                                    )}


                                    </td>

                                  </tr>
                                ))}
                              </tbody>
                          </table>
                        </div>

                        {editUser && (
                          <div className="taskmodal">

                            <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", background: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}> 
                              <h3>Edit User</h3> <br /> 
                              <label> Username: 
                              <input
                                type="text"
                                value={formDatas.username}
                                onChange={(e) => setFormDatas({ ...formDatas, username: e.target.value })}
                                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                              /> 
                              </label> <br /> 
                              <label> Full Name: 
                              <input
                                type="text"
                                value={formDatas.fullname}
                                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                                onChange={(e) => setFormDatas({ ...formDatas, fullname: e.target.value })}
                              />

                              </label> <br /> 
                              <label> Password:
                              <input
                                type="password"
                                value={formDatas.password}
                                onChange={(e) => setFormData({ ...formDatas, password: e.target.value })}
                                placeholder="Leave blank to keep current password"
                                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
                              />
                                
                              </label> <br /> 
                              <div style={{ marginTop: "10px" }}>
                              <button
                                  onClick={saveEditHandler}
                                  disabled={saving}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: saving ? "#ccc" : "#2563eb",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: saving ? "not-allowed" : "pointer"
                                  }}
                                >
                                  {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                  onClick={() => setEditUser(null)}
                                  style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#e5e7eb",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor:'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                              </div>
                          </div>
                              
                          )}
                    </div>
                </div>

                

            </div>
            <PersonalProjects/>
        </div>
      </TaskProvider>
  )
}

export default Main