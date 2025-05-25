import React, { useMemo, useState } from "react";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
// import "./GanttChart.css";
import {
  CheckSquare,
  PlusCircle,
  Users,
  LayoutDashboard,
  BarChart2,
} from "lucide-react";


const departments: Department[] = [
  {
    id: "dept-1",
    name: "Marketing",
    tasks: [
      {
        id: "task-1",
        name: "Develop Sponsorship Program",
        start: "2025-05-01",
        end: "2025-05-10",
        progress: 45,
        dependencies: [],
      },
      {
        id: "task-2",
        name: "Secure Sponsorships",
        start: "2025-05-11",
        end: "2025-05-18",
        progress: 20,
        dependencies: ["task-1"],
      },
    ],
  },
  {
    id: "dept-2",
    name: "Operations",
    tasks: [
      {
        id: "task-3",
        name: "Logistics Planning",
        start: "2025-05-05",
        end: "2025-05-15",
        progress: 30,
        dependencies: [],
      },
    ],
  },
];

function App() {
  const [filter, setFilter] = useState("");

  const ganttTasks = useMemo(() => {
  return departments.flatMap((dept) =>
    dept.tasks.map((task) => ({
      start: new Date(task.start),
      end: new Date(task.end),
      name: task.name,
      id: task.id,
      type: "task",
      progress: task.progress,
      isDisabled: false,
      dependencies: task.dependencies,
      styles: {
        progressColor: "#6366f1",
        progressSelectedColor: "#818cf8",
      },
    }))
  );
}, []);

  const filteredTasks = filter
    ? ganttTasks.filter((task) =>
        task.name.toLowerCase().includes(filter.toLowerCase())
      )
    : ganttTasks;

  return (
    <div className="dashboard-container">
      {/* Header Overview */}
      <div className="card full-span flex-between">
        <h1 className="title-xl">Project Management Dashboard</h1>
        <div className="flex gap">
          <button className="btn-primary">Admin Mode</button>
          <button className="btn-outline">User Mode</button>
        </div>
      </div>

      {/* Gantt Chart UI */}
      <div className="card double-span">
        <div className="flex-between mb">
          <h2 className="title-lg">Gantt Chart</h2>
          <button className="btn-sm-outline">Zoom View</button>
        </div>
        <input
          type="text"
          placeholder="Filter tasks..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
        <div className="gantt-wrapper">
          <Gantt tasks={filteredTasks} viewMode={ViewMode.Day} />
        </div>
      </div>

      {/* Department Progress */}
      <div className="card">
        <h3 className="title-md mb">Department Progress</h3>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "75%" }}></div>
        </div>
        <p className="text-sm">Marketing - 75% completed</p>
      </div>

      {/* Task Checklist */}
      <div className="card">
        <div className="flex-between mb">
          <h3 className="title-md">Checklist</h3>
          <button className="icon-btn-sm">
            <PlusCircle className="icon" /> Add
          </button>
        </div>
        <ul className="checklist">
          <li>
            <CheckSquare className="check-done" />
            <span className="text-strike">Define Milestones</span>
          </li>
          <li>
            <CheckSquare className="check-pending" />
            <span>Assign Teams</span>
          </li>
          <li>
            <CheckSquare className="check-pending" />
            <span>Review Timeline</span>
          </li>
        </ul>
      </div>

      {/* Analytics */}
      <div className="card">
        <div className="flex gap mb">
          <BarChart2 className="icon-blue" />
          <h3 className="title-md">Analytics</h3>
        </div>
        <p className="text-sm">
          Overview of progress across departments and tasks.
        </p>
      </div>

      {/* User Management */}
      <div className="card">
        <div className="flex gap mb">
          <Users className="icon-purple" />
          <h3 className="title-md">User Management</h3>
        </div>
        <p className="text-sm">
          Add users, assign roles, and manage department access.
        </p>
      </div>

      {/* Admin Panel */}
      <div className="card full-span">
        <div className="flex gap mb">
          <LayoutDashboard className="icon-green" />
          <h2 className="title-lg">Admin Control Panel</h2>
        </div>
        <button className="btn-success mr">Create Department</button>
        <button className="btn-outline">Assign Task</button>
      </div>
    </div>
  );
}

export default App;
