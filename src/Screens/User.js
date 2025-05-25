import React, { useEffect, useState } from "react";
import { useTaskContext } from "../context/TaskContext";import { IoIosLogOut } from "react-icons/io";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { TaskProvider } from '../context/TaskContext';
import GanttWithProgress from "../Component/GanttWithProgress";
import FetchTasks from "../Component/FetchTasks";
import DepartmentProgressBars from "../Component/DepartmentProgressBars";
import DeptTask from "../Component/DeptTask";
import GanttBar from "../Component/GanttBar";


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
    const username = loggedInUser?.fullname || "";
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

  const personalGanttTasks = [
    ...devTasks.map((task, i) => generateGanttTask(task, i, "dev")),
    ...designTasks.map((task, i) => generateGanttTask(task, i, "design")),
  ];

  const devProgress = getProgress(devTasks);
  const designProgress = getProgress(designTasks);

  const departmentGanttTasks = [
    {
      id: "project-dev",
      name: "Development (Zipha)",
      type: "project",
      start: dayjs().toDate(),
      end: dayjs().add(devTasks.length, "day").toDate(),
      progress: devProgress,
      hideChildren: false,
    },
    ...devTasks.map((task, i) => generateGanttTask(task, i, "dev", "project-dev")),

    {
      id: "project-design",
      name: "Design (The Keyboard)",
      type: "project",
      start: dayjs().toDate(),
      end: dayjs().add(designTasks.length, "day").toDate(),
      progress: designProgress,
      hideChildren: false,
    },
    ...designTasks.map((task, i) => generateGanttTask(task, i, "design", "project-design")),
  ];

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

  return (
    <TaskProvider>
      <div className="dashboard-container users-dashboard">
        {/* Sidebar */}
        <div className="user-sidebar">
          <aside className="sidebar">
            <h2>PROJECTS</h2>
            <ul>
              <li>Zipha</li>
              <li>The Keyboard</li>
              <li>FalconGrey</li>
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
          <div className="header">
            <h1>User Dashboard</h1>
            <div>
              Logged in as: <strong>{username}</strong>
            </div>
          </div>

          {/* Personal Gantt Chart */}
        
          
            <Card className={`main-s ${isZoomed ? "zoom-mode" : ""}`}>
              <div className={`gantt ${isZoomed ? "fullscreen-gantt" : ""}`} >
                <div className="z-btn">
                    <h3>Gantt Chart</h3>
                      <button className="zoom" onClick={toggleZoom}>
                          {isZoomed ? "EXIT ZOOM" : "ZOOM VIEW"}
                      </button>
                </div>
                <GanttBar/>
              </div>
            </Card>
          
            <div className="user-checklists dept-tasks">
            <Card>
              <h2>Department Tasks</h2>

              
              <DeptTask/>
            </Card>
          </div>

          {/* Checklist */}
          <div className="user-checklists">
            <Card>
              <h2>Personal Checklist</h2>

              
              <FetchTasks/>
            </Card>
          </div>

          {/* Department Progress */}
          <DepartmentProgressBars/>

          
        </main>
      </div>
    </TaskProvider>
  );
}
