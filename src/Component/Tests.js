import React, { useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { useTaskContext } from "../context/TaskContext";

const GanttWithProgress = () => {
  const { tasks: allTasks, loading } = useTaskContext();
  const [openDepartments, setOpenDepartments] = useState({});

  const toggleDepartment = (deptId) => {
    setOpenDepartments((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const transformToGanttTasks = () => {
    const grouped = {};
    allTasks.forEach((task) => {
      const dept = task.department || "Unassigned";
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push(task);
    });

    const ganttTasks = [];
    
    Object.entries(grouped).forEach(([dept, deptTasks]) => {
      const deptId = `dept-${dept}`;
      const total = deptTasks.length;
      const completed = deptTasks.filter((t) => t.checked === true).length; // Explicitly check for true
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const start = new Date(Math.min(...deptTasks.map(t => new Date(t.startDate))));
      const end = new Date(Math.max(...deptTasks.map(t => new Date(t.endDate))));

      // Department row
      ganttTasks.push({
        id: deptId,
        name: `${dept} (${percent}%)`,
        start,
        end,
        type: "task", // Changed back to task type like regular tasks
        progress: percent, // Show actual progress
        isDisabled: false,
        hideChildren: !openDepartments[deptId], // This controls visibility
        styles: {
          backgroundColor: '#e0e0e0', // Plain grey background
          progressColor: '#4caf50', // Green progress
          progressSelectedColor: '#4caf50'
        }
      });

      // Always add tasks but mark them as children
      ganttTasks.push(
        ...deptTasks.map((task) => ({
          id: String(task.id),
          name: task.task,
          start: new Date(task.startDate),
          end: new Date(task.endDate),
          type: "task",
          project: deptId, // This creates the parent-child relationship
          progress: task.checked === true ? 100 : 0, // 100% if checked is true, 0% if false
          isDisabled: false,
        }))
      );
    });

    return ganttTasks;
  };

  const handleTaskClick = (task) => {
    // Handle clicks on tasks (not for toggling)
    console.log("Task clicked:", task.name);
  };

  const handleExpanderClick = (task) => {
    // Also handle expander click for departments
    if (task.id.startsWith("dept-")) {
      const deptId = task.id;
      toggleDepartment(deptId);
    }
  };

  const handleTaskChange = (task) => {
    // Handle task changes (dragging, etc.)
    console.log("Task changed:", task);
  };

  if (loading) return <p>Loading Gantt chart...</p>;

  return (
    <div style={{ padding: "20px" }}>
      {/* <h2>Departmental Gantt Chart</h2> */}
      <style>
        {`
          .gantt-task-content {
            border-radius: 0 !important;
          }
          .gantt-task-progress {
            border-radius: 0 !important;
            height: 100% !important;
          }
          .gantt-task {
            border-radius: 0 !important;
          }
        `}
      </style>
      <Gantt
        tasks={transformToGanttTasks()}
        viewMode={ViewMode.Day}
        onClick={handleTaskClick}
        onExpanderClick={handleExpanderClick}
        onDateChange={handleTaskChange}
        onProgressChange={handleTaskChange}
        locale="en-GB"
      />
    </div>
  );
};

export default GanttWithProgress;