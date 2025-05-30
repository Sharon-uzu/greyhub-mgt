import React, { useEffect, useState } from "react";
import { useTaskContext } from "../context/TaskContext";import { IoIosLogOut } from "react-icons/io";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { TaskProvider } from '../context/TaskContext';
import GanttWithProgress from "../Component/GanttWithProgress";
import FetchTasks from "../Component/FetchTasks";
import DepartmentProgressBars from "../Component/DepartmentProgressBars";
import DeptTask from "../Component/DeptTask";
import GanttBar from "../Component/GanttBar";
import StaffProjects from "../Component/Staffprojects";
import { FaCircleUser } from "react-icons/fa6";


// UI Components
const Card = ({ children }) => <div className="card">{children}</div>;

const Progress = ({ value }) => (
  <div className="progress-container">
    <div className="progress-bar" style={{ width: `${value}%` }} />
  </div>
);

const Checkbox = ({ checked, onChange }) => (
  <input type="checkbox" checked={checked} onChange={onChange} className="checkbox" />
);

export default function User() {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
    const fullname = loggedInUser?.fullname || "";
    const username = loggedInUser?.username || "";

    console.log(username)

    const handleLogout = () => {
      localStorage.removeItem("ganttUser"); 
      navigate("/");  // Redirect to login
    };

  const [devTasks, setDevTasks] = useState([
    { id: 1, title: "Design homepage", completed: true },
    { id: 2, title: "Implement login feature", completed: false },
    { id: 3, title: "Write API docs", completed: false },
  ]);

  const [designTasks, setDesignTasks] = useState([
    { id: 4, title: "Create wireframes", completed: true },
    { id: 5, title: "Make mockups", completed: false },
    { id: 6, title: "Design final UI", completed: false },
  ]);

  const getProgress = (tasks) => {
    const completed = tasks.filter((t) => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const generateGanttTask = (task, i, prefix, project = null) => ({
    id: `${prefix}-${task.id}`,
    name: task.title,
    start: dayjs().add(i, "day").toDate(),
    end: dayjs().add(i + 1, "day").toDate(),
    type: "task",
    progress: task.completed ? 100 : 0,
    isDisabled: false,
    ...(project && { project }),
  });

  

  const renderTaskList = (tasks, setTasks) =>
    tasks.map((task) => (
      <li key={task.id} className="task-item">
        <Checkbox
          checked={task.completed}
          onChange={() =>
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
            )
          }
        />
        <span className={task.completed ? "completed" : ""}>{task.title}</span>
      </li>
    ));

    const [isZoomed, setIsZoomed] = useState(false);

    const toggleZoom = () => {
    setIsZoomed((prev) => !prev);
    };

    const { tasks, loading } = useTaskContext();
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      // Create a unique key for dept + project
      const grouped = {};

      tasks.forEach((task) => {
        const department = task.department || "Unassigned";
        const project = task.project || "No Project";
        const key = `${department}|||${project}`;

        if (!grouped[key]) {
          grouped[key] = { total: 0, completed: 0 };
        }

        grouped[key].total += 1;
        if (task.checked) {
          grouped[key].completed += 1;
        }
      });

      // Format into array for easier rendering
      const formatted = Object.entries(grouped).map(([key, value]) => {
        const [department, project] = key.split("|||");
        const percent = value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0;
        return {
          department,
          project,
          percent,
        };
      });

      setProgressData(formatted);
    }
  }, [tasks, loading]);

  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    if (!loading && tasks.length > 0) {
      const userTasks = tasks.filter(task => task.assignedTo === username); // Corrected this line
  
      const uniqueProjects = [
        ...new Set(userTasks.map(task => task.project).filter(Boolean))
      ];
  
      setUserProjects(uniqueProjects);
    }
  }, [loading, tasks, username]);
  
 

  return (
    <TaskProvider>
      <div className="dashboard-container users-dashboard">
        {/* Sidebar */}
        <div className="user-sidebar">
        <aside className="sidebar">
          <h2>Projects</h2>
          <ul>
            {userProjects.length > 0 ? (
              userProjects.map((project, idx) => (
                <li style={{color:'#000'}} key={idx}>{project}</li>
              ))
            ) : (
              <li>No projects yet</li>
            )}
          </ul>
        </aside>


          <div className="logout">
            <h2 onClick={handleLogout} style={{cursor:'pointer'}}>
              <IoIosLogOut className="l-i" /> LogOut
            </h2>
          </div>
        </div>

        {/* Main Content */}
        <main className="main-content">
          <div className="header" style={{width:'100%', color:'#fff', display:'flex', justifyContent:'space-between'}}>
            <h1>Welcome {fullname}</h1>

            <div>
              <Link to='/project' style={{cursor:'pointer', textDecoration:'none', fontSize:'28px', color:'#fff'}}><FaCircleUser /></Link>
            </div>
          </div>

          {/* Personal Gantt Chart */}
        
          
            <div className={`card main-s ${isZoomed ? "zoom-mode" : ""}`}>
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
            </div>
          
            <div className="user-checklists dept-tasks">
            <Card>
              

              {/* <div className="tasks-scroll"> */}
                <DeptTask/>
                
              {/* </div> */}
            </Card>
          </div>

          {/* Checklist */}
          <div className="user-checklists">
            <Card>
              <h2>Personal Checklist</h2>

              
              {/* <div className="tasks-scroll"> */}
                <FetchTasks/>
              {/* </div> */}
            </Card>
          </div>

          {/* Department Progress */}
          {/* <DepartmentProgressBars/> */}
          <StaffProjects/>
          
        </main>
      </div>
    </TaskProvider>
  );
}
