import React, { useEffect, useState } from "react";
import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Supabase } from "../config/supabase-config";
import { useTaskContext } from "../context/TaskContext";

const GanttWithProgress = () => {

  const { tasks: allTasks, loading, setTasks } = useTaskContext();
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
      const completed = deptTasks.filter((t) => t.checked === true).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const start = new Date(Math.min(...deptTasks.map(t => new Date(t.startDate))));
      const end = new Date(Math.max(...deptTasks.map(t => new Date(t.endDate))));
  
      // Department row (basic, no custom styles)
      const isOpen = openDepartments[deptId];
      const arrow = isOpen ? "▼" : "▶";
      const assignedProject = deptTasks[0]?.project || "No Project";

      ganttTasks.push({
        id: deptId,
        name: ` ${dept} (${percent}%)`,
        start,                                                                                                                                                                                                        
        end,
        type: "project",
        progress: percent,
        // isDisabled: false,
        hideChildren: !isOpen,
        styles: {
          backgroundColor: '#e0e0e0',
          progressColor: '#4caf50',
          progressSelectedColor: '#4caf50'
        }
      });

        
      // Child tasks
      ganttTasks.push(
        ...deptTasks.map((task) => {
          const start = new Date(task.startDate);
          const end = new Date(task.endDate);
          const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
          return {
            id: String(task.id),
            name: `${task.task} | ${task.assignedTo || "Unassigned"} `,
            start,
            end,
            type: "task",
            project: deptId,
            progress: task.checked ? 100 : 0,
            isDisabled: false,
          };
        
          
        })
        
      );
    });
  
    return ganttTasks;
  };
  

  const handleTaskClick = (task) => {
    if (task.type === "project" && task.id.startsWith("dept-")) {
      toggleDepartment(task.id); // Toggle on click of progress bar or row
    } else {
      console.log("Task clicked:", task.name);
    }
  };
  

  const handleExpanderClick = (task) => {
    // Also handle expander click for departments
    if (task.id.startsWith("dept-")) {
      const deptId = task.id;
      toggleDepartment(deptId);
    }
  };

  const handleTaskChange = async (task) => {
    if (task.type === "project") return; // ignore dragging departments
    
    const updatedTask = {
    startDate: task.start.toISOString(),
    endDate: task.end.toISOString(),
    };
    
    const { error } = await Supabase
    .from("gantt-tasks")
    .update(updatedTask)
    .eq("id", task.id);
    
    if (error) {
    console.error("Failed to update task in Supabase:", error);
    return;
    }
    
    // Update local context state for immediate UI feedback
    // Note: add setTasks from useTaskContext
    setTasks((prevTasks) =>
    prevTasks.map((t) =>
    String(t.id) === task.id
    ? { ...t, startDate: updatedTask.startDate, endDate: updatedTask.endDate }
    : t
    )
    );
    };

  if (loading) return <p>Loading Gantt chart...</p>;

  return (
    <div style={{ padding: "20px" }}>
      {/* <h2>Departmental Gantt Chart</h2> */}
      <style>
  {`
    /* Shrink left table (Name, From, To columns) */
    .gantt .gantt-table {
      width: 250px !important;
    }

    .gantt .gantt-horizontal-container {
      left: 250px !important;
    }

    /* Remove rounded corners */
    .gantt-task,
    .gantt-task-progress,
    .gantt-task-content {
      border-radius: 30px !important;
    }

    /* Make all progress bars full height */
    .gantt-task .gantt-task-progress {
      height: 100% !important;
      top: 0 !important;
    }

    /* Consistent height for all tasks */
    .gantt-task {
      height: 30px !important;
    }

    /* Hide From and To columns on mobile */
    @media (max-width: 768px) {
      .gantt .gantt-table-header-cell:nth-child(2),
      .gantt .gantt-table-header-cell:nth-child(3),
      .gantt .gantt-table-row .gantt-table-cell:nth-child(2),
      .gantt .gantt-table-row .gantt-table-cell:nth-child(3) {
        display: none !important;
      }

      /* Reduce table width more on mobile */
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