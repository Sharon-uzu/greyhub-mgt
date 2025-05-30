import React, { useEffect, useState } from "react";
import "gantt-task-react/dist/index.css";
import { Supabase } from "../config/supabase-config";
import { TaskProvider } from '../context/TaskContext';
import { FiLogOut } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import CreateTask from "../Component/CreateTask";
import { FaCircleUser } from "react-icons/fa6";


import {
    PlusCircle,
    Users,
    
  } from "lucide-react";
  
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import FetchTasks from "../Component/FetchTasks";
import GanttWithProgress from "../Component/GanttWithProgress";
import Tasks from "../Component/Tasks";
import GanttBar from "../Component/GanttBar";
import ProductList from "../Component/ProductList";
import ProjectList from "../Component/ProjectList";

const initialTasks = [

];


const SubAdmin = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState(initialTasks);
    const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
    const username = loggedInUser?.username || "";
    console.log(username)


  const [activeProject, setActiveProject] = useState("Ziphabot");
    const [addNewTask, setAddNewTask] = useState(false)

    const [isZoomed, setIsZoomed] = useState(false);

    const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
    };


    const [addNewDepartment, setAddNewDepartment] = useState(false)

    function AddDepartment(){
        setAddNewDepartment(!addNewDepartment)
    }

    const [addNewUser, setAddNewUser] = useState(false)


    const [addNewProject, setAddNewProject] = useState(false)


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

  

  const validate = (values) => {
    const errors = {};
  
    if (!values.fullname) errors.fullname = "Full name is required";
    if (!values.username) errors.username = "Username is required";
    if (!values.password) errors.password = "Password is required";
  
    return errors;
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
  
    if (!error) {
      const filteredUsers = data.filter(user => user.role !== "admin");
      setUsers(filteredUsers);
    }
    setLoading(false);
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

  
  
  function AddTask(){
    setAddNewTask(!addNewTask)
}


  
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
                  <Link to='/project' style={{cursor:'pointer', textDecoration:'none', fontSize:'28px', color:'#fff'}}><FaCircleUser /></Link>

                </div>
            </div>
            <div className="admin-logout">
              <h4 style={{fontSize:'18px', fontWeight:600, marginRight:"9px", color:'#fff'}}>{username}</h4>
              <div  onClick={handleLogout} style={{ cursor: "pointer",color:'#fff', display:'flex', alignItems:'center', gap:'8px' }}>
                <FiLogOut style={{color:'#fff'}}/>
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

                      <GanttBar/>
                    </div>
                    
                </div>
                

                {!isZoomed && (
                    <aside className="sidebar card">
                        <div className="flex-between mb">
                            <h3 className="title-md" style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: '#1e293b' }}>Projects</h3>
                            
                        </div>
                        <div className="task-scroll">
                          <ProjectList/>
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
                      <Tasks/>
                      
                    </div>
                    
                    </aside>

                    {
                        addNewTask ? (<>

                        <div className="taskmodal" >
                        
                          <CreateTask addNewTask={addNewTask} setAddNewTask={setAddNewTask}/>

                        </div>
                        </>) : null
                    }

                    <aside className="sidebar card">
                      <div className="flex-between mb">
                        <h3 className="title-md">Personal Checklist</h3>
                      </div>
                      <div className="task-scroll" style={{marginTop:'15px'}}>
                      <FetchTasks/>
                      
                    </div>
                    </aside>


                    <div className="sidebar card">
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
                                <th style={{ padding: "8px", border: "1px solid #ccc", textAlign:'start' }}>Users</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user) => (
                                <tr key={user.id}>
                                  <td style={{ padding: "8px", border: "1px solid #eee" }}>{user.username}</td>
                                  
                                  
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </TaskProvider>
  )
}

export default SubAdmin;