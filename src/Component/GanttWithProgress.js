import React, { useEffect, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Supabase } from "../config/supabase-config";
import { useTaskContext } from "../context/TaskContext";

const getRandomColor = (index) => {
  const hue = (index * 137.508) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

  

const GanttWithProgress = () => {
const { tasks: allTasks, loading, setTasks } = useTaskContext();
const [openDepartments, setOpenDepartments] = useState({});
const [selectedProject, setSelectedProject] = useState("All");

const toggleDepartment = (deptId) => {
setOpenDepartments((prev) => ({
...prev,
[deptId]: !prev[deptId],
}));
};

const projects = Array.from(
new Set(allTasks.map((t) => t.project || "Unassigned"))
);

const filteredTasks =
selectedProject === "All"
? allTasks
: allTasks.filter(
(task) => (task.project || "Unassigned") === selectedProject
);

const transformToGanttTasks = () => {
const grouped = {};
filteredTasks.forEach((task) => {
const dept = task.department || "Unassigned";
if (!grouped[dept]) grouped[dept] = [];
grouped[dept].push(task);
});

const ganttTasks = [];

Object.entries(grouped).forEach(([dept, deptTasks]) => {
  const deptId = `dept-${dept}`;
  const total = deptTasks.length;
  const completed = deptTasks.filter((t) => t.checked === true).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const start = new Date(
    Math.min(...deptTasks.map((t) => new Date(t.startDate)))
  );
  const end = new Date(
    Math.max(...deptTasks.map((t) => new Date(t.endDate)))
  );
  const isOpen = openDepartments[deptId];

  ganttTasks.push({
    id: deptId,
    name: ` ${dept} (${percent}%)`,
    start,
    end,
    type: "project",
    progress: percent,
    hideChildren: !isOpen,
    styles: {
      backgroundColor: "#90969f",
      progressColor: "#5e5e5e",
      progressSelectedColor: "#000",
    },
  });

  ganttTasks.push(
    ...deptTasks.map((task) => {
      const start = new Date(task.startDate);
      const end = new Date(task.endDate);
      const color = task.color || "#00bcd4"; // Fallback to default if color is undefined
    
      return {
        id: String(task.id),
        name: `\u00A0\u00A0\u00A0\u00A0${task.task} | ${task.assignedTo || "Unassigned"}`,
        start,
        end,
        type: "task",
        project: deptId,
        progress: task.checked ? 100 : 0,
        isDisabled: false,
        styles: {
          backgroundColor: color,
          progressColor: color,
          progressSelectedColor: "#000",
          backgroundSelectedColor: color,
          barCornerRadius: 30,
          borderColor: color,
          borderWidth: 2,
        },
      };
    })
  );
});

return ganttTasks;
};

const ganttTasks = transformToGanttTasks();

const getMonthYearLabel = () => {
if (!ganttTasks.length) return "";


const allDates = ganttTasks.flatMap((task) => [task.start, task.end]);
const minDate = new Date(Math.min(...allDates.map((d) => new Date(d))));
const maxDate = new Date(Math.max(...allDates.map((d) => new Date(d))));

const options = { month: "long", year: "numeric" };
const startLabel = minDate.toLocaleDateString("en-GB", options);
const endLabel = maxDate.toLocaleDateString("en-GB", options);

return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
};

const handleTaskClick = (task) => {
if (task.type === "project" && task.id.startsWith("dept-")) {
toggleDepartment(task.id);
} else {
console.log("Task clicked:", task.name);
}
};

const handleExpanderClick = (task) => {
if (task.id.startsWith("dept-")) {
toggleDepartment(task.id);
}
};

const handleTaskChange = async (task) => {
if (task.type === "project") return;

const updatedTask = {
  startDate: task.start.toISOString(),
  endDate: task.end.toISOString(),
};

const { error } = await Supabase.from("gantt-tasks")
  .update(updatedTask)
  .eq("id", task.id);

if (error) {
  console.error("Failed to update task in Supabase:", error);
  return;
}

setTasks((prevTasks) =>
  prevTasks.map((t) =>
    String(t.id) === task.id
      ? {
          ...t,
          startDate: updatedTask.startDate,
          endDate: updatedTask.endDate,
        }
      : t
  )
);
};

if (loading)
return <p style={{ width: "95%", margin: "auto" }}>Loading Gantt chart...</p>;

return (
<div style={{ width: "95%", margin: "auto", padding: "10px", position: "relative" }}>
<div style={{ marginBottom: "20px" }}>
<label style={{ marginRight: "8px", fontWeight: "500" }}>Filter by Project:</label>
<select
value={selectedProject}
onChange={(e) => setSelectedProject(e.target.value)}
style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #ccc" }}
>
<option value="All">All</option>
{projects.map((proj) => (
<option key={proj} value={proj}>
{proj}
</option>
))}
</select>
</div>


  <h2
    style={{
      textAlign: "end",
      marginBottom: "10px",
      color: "#334155",
      fontSize: "16px",
    }}
  >
    {getMonthYearLabel()}
  </h2>

  <style>
    {`
      .gantt .gantt-table {
        width: 250px !important;
      }
      .gantt .gantt-horizontal-container {
        left: 250px !important;
      }
      .gantt-task,
      .gantt-task-progress,
      .gantt-task-content {
        border-radius: 30px !important;
      }
      .gantt-task .gantt-task-progress {
        height: 100% !important;
        top: 0 !important;
      }
      .gantt-task .bar-progress {
        rx: 30;
        ry: 30;
      }
      .gantt-task {
        height: 30px !important;
      }
      .gantt .gantt-table-row:not(.project) .gantt-table-cell:first-child {
        padding-left: 40px !important;
        font-weight: normal;
      }
      .gantt .gantt-table-row[data-testid="task-row"][data-type="task"] .gantt-table-cell:first-child {
        padding-left: 36px !important;
      }
      .gantt .gantt-table-row.project .gantt-table-cell:first-child {
        font-weight: 600;
      }

      .gantt .gantt-table-header-cell:nth-child(2),
      .gantt .gantt-table-header-cell:nth-child(3),
      .gantt .gantt-table-row .gantt-table-cell:nth-child(2),
      .gantt .gantt-table-row .gantt-table-cell:nth-child(3) {
        display: none !important;
      }

      .gantt .gantt-table {
        width: 180px !important;
      }

      .gantt .gantt-horizontal-container {
        left: 180px !important;
      }

      @media (max-width: 768px) {
        .gantt .gantt-table-header-cell:nth-child(2),
        .gantt .gantt-table-header-cell:nth-child(3),
        .gantt .gantt-table-row .gantt-table-cell:nth-child(2),
        .gantt .gantt-table-row .gantt-table-cell:nth-child(3) {
          display: none !important;
        }

        .gantt .gantt-table {
          width: 120px !important;
        }

        .gantt .gantt-horizontal-container {
          left: 120px !important;
        }
      }
    `}
  </style>

  <Gantt
    tasks={ganttTasks}
    viewMode={ViewMode.Day}
    onClick={handleTaskClick}
    onExpanderClick={handleExpanderClick}
    onDateChange={handleTaskChange}
    onProgressChange={handleTaskChange}
    locale="en-GB"
    listCellWidth="180px"
  />
</div>
);
};

export default GanttWithProgress;