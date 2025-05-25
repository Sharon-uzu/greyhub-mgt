import React, { useEffect, useRef, useMemo, useState } from "react";
import gantt from "dhtmlx-gantt";
import { Gantt, Task, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";

import "dhtmlx-gantt/codebase/dhtmlxgantt.css";

const departments = ["Development", "Design", "QA", "Deployment"];

const initialTasks = [
  {
    id: 1,
    text: "Setup Backend",
    start_date: "2025-05-21",
    duration: 3,
    progress: 0,
    owner: "Alice",
    department: "Development",
    completed: false,
  },
  {
    id: 2,
    text: "Frontend UI",
    start_date: "2025-05-22",
    duration: 4,
    progress: 0,
    owner: "Bob",
    department: "Design",
    completed: false,
  },
  {
    id: 3,
    text: "Testing",
    start_date: "2025-05-26",
    duration: 2,
    progress: 0,
    owner: "Charlie",
    department: "QA",
    completed: false,
  },
  {
    id: 4,
    text: "Setup Admin",
    start_date: "2025-05-21",
    duration: 3,
    progress: 0,
    owner: "Alice",
    department: "Development",
    completed: false,
  },
];

const Test = () => {
    const ganttContainer = useRef(null);
    const [tasks, setTasks] = useState(initialTasks);
    const [newTask, setNewTask] = useState({
      text: "",
      owner: "",
      department: departments[0],
      start_date: "",
      duration: 1,
    });
  
    gantt.config.lightbox.sections = [
      { name: "description", height: 70, map_to: "text", type: "textarea", focus: true },
      { name: "owner", height: 30, map_to: "owner", type: "text" },
      { name: "department", height: 30, map_to: "department", type: "select", options: departments.map(dep => ({ key: dep, label: dep })) },
      { name: "time", type: "duration", map_to: "auto" },
    ];
    
    gantt.attachEvent("onLightboxSave", function(id, task, is_new){
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                text: task.text,
                owner: task.owner,
                department: task.department,
                start_date: task.start_date.toISOString().slice(0, 10),
                duration: task.duration,
              }
            : t
        )
      );
      return true;
    });
    
    
  
    const generateGanttData = (tasks, departments) => {
      const { minDate, maxDate } = getGlobalDateRange(tasks);
    
      const departmentTasks = departments.map((dep, index) => {
        const departmentTaskChildren = tasks.filter(t => t.department === dep);
        const progress = departmentTaskChildren.length
          ? departmentTaskChildren.filter(t => t.completed).length / departmentTaskChildren.length
          : 0;
    
        return {
          id: `dep-${index}`,
          text: `${dep} Progress`,
          start_date: minDate,
          end_date: maxDate,
          progress,
          type: "project",
          readonly: true,
          open: true,
        };
      });
    
      const taskItems = tasks.map((t) => {
        const depId = `dep-${departments.indexOf(t.department)}`;
        return {
          ...t,
          start_date: new Date(t.start_date),
          parent: depId,
        };
      });
    
      return {
        data: [...departmentTasks, ...taskItems],
      };
    };
  
    const getGlobalDateRange = (tasks) => {
      if (!tasks.length) return { minDate: null, maxDate: null };
    
      let minDate = new Date(tasks[0].start_date);
      let maxDate = new Date(tasks[0].start_date);
      
      tasks.forEach((task) => {
        const start = new Date(task.start_date);
        const end = new Date(start);
        end.setDate(end.getDate() + task.duration);
        
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
      });
    
      return { minDate, maxDate };
    };
    
  
    // Initialize gantt
    useEffect(() => {
      gantt.config.columns = [
        { name: "text", label: "Task Name", width: "*", tree: true },
        { name: "start_date", label: "Start Date", align: "center" },
        { name: "duration", label: "Duration (days)", align: "center" },
        { name: "owner", label: "Assigned To", align: "center" },
      ];
    
      gantt.config.scale_unit = "day";
      gantt.config.date_scale = "%d %M";
      gantt.config.drag_move = true;
      gantt.config.drag_resize = true;
      gantt.config.drag_progress = true;
      gantt.config.grid_width = 350;
    
      // 👇 Add this here
      gantt.templates.task_class = function (start, end, task) {
        if (task.type === "project") return "department-task";
        return "";
      };
    
      gantt.init(ganttContainer.current);
  
      
     gantt.templates.progress_text = function(start, end, task) {
    return "";
  };
  
      gantt.templates.task_class = function(start, end, task) {
        if (task.department === "Development") return "dev-progress";
        if (task.department === "Design") return "design-progress";
        if (task.department === "QA") return "qa-progress";
        if (task.department === "Deployment") return "deploy-progress";
        return "";
      };
  
      
      
      gantt.parse(generateGanttData(tasks, departments));
      
      // Update local state if gantt task is updated by drag
      gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  start_date: task.start_date.toISOString().slice(0, 10),
                  duration: task.duration,
                }
              : t
          )
        );
      });
    }, [tasks]);
  
    // Add task handler
    const addTask = (e) => {
      e.preventDefault();
      if (!newTask.text || !newTask.owner || !newTask.start_date) return alert("Please fill all fields");
      const id = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
      const taskToAdd = { ...newTask, id, progress: 0, completed: false };
  
      setTasks((prev) => [...prev, taskToAdd]);
      setNewTask({
        text: "",
        owner: "",
        department: departments[0],
        start_date: "",
        duration: 1,
      });
    };
  
    // Toggle task completion
    const toggleComplete = (id) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === id
            ? { ...t, completed: !t.completed, progress: t.completed ? 0 : 1 }
            : t
        );
        gantt.clearAll();
        gantt.parse(generateGanttData(updated, departments));
        return updated;
      });
    };
    
  
    return (
      <div className="container">
        <aside className="sidebar">
          <h2>Departments & Tasks</h2><br />
          {departments.map((dep) => (
            <div key={dep} className="department">
              <h3>{dep}</h3>
              <ul>
                {tasks
                  .filter((t) => t.department === dep)
                  .map((task) => (
                    <li key={task.id}>
                      <label className={task.completed ? "completed" : ""}>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleComplete(task.id)}
                        />{" "}
                        {task.text} ({task.owner})
                      </label>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
  
          <form onSubmit={addTask} className="task-form">
            <h3>Add New Task</h3>
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.text}
              onChange={(e) => setNewTask({ ...newTask, text: e.target.value })}
            />
            <input
              type="text"
              placeholder="Assigned To"
              value={newTask.owner}
              onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
            />
            <select
              value={newTask.department}
              onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.start_date}
              onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
            />
            <input
              type="number"
              min="1"
              value={newTask.duration}
              onChange={(e) => setNewTask({ ...newTask, duration: +e.target.value })}
            />
            <button type="submit">Add Task</button>
          </form>
        </aside>
  
        <main className="gantt-container" ref={ganttContainer}></main>
      </div>
  )
}

export default Test



