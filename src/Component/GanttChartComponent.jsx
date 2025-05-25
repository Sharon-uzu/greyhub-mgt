import React, { useEffect, useRef, useState } from "react";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import gantt from "dhtmlx-gantt";

const departments = ["Marketing", "Operations"];

const initialTasks = [
  {
    id: 1,
    text: "Develop Sponsorship Program",
    start_date: "2025-05-01",
    duration: 9,
    progress: 45,
    owner: "Alice",
    department: "Marketing",
    completed: false,
  },
  {
    id: 2,
    text: "Secure Sponsorships",
    start_date: "2025-05-11",
    duration: 8,
    progress: 20,
    owner: "Bob",
    department: "Marketing",
    completed: false,
  },
  {
    id: 3,
    text: "Logistics Planning",
    start_date: "2025-05-05",
    duration: 10,
    progress: 30,
    owner: "Charlie",
    department: "Operations",
    completed: false,
  },
];

const GanttChartComponent = () => {
  const ganttRef = useRef(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState({
    text: "",
    owner: "",
    department: departments[0],
    start_date: "",
    duration: 1,
  });

  const getMinDate = (list) => {
    if (!list.length) return new Date().toISOString().slice(0, 10);
    return list.reduce((min, t) => {
      const date = new Date(t.start_date);
      return date < min ? date : min;
    }, new Date(list[0].start_date)).toISOString().slice(0, 10);
  };

  const getMaxDate = (list) => {
    if (!list.length) return new Date().toISOString().slice(0, 10);
    return list.reduce((max, t) => {
      const date = new Date(t.start_date);
      date.setDate(date.getDate() + t.duration);
      return date > max ? date : max;
    }, new Date(list[0].start_date)).toISOString().slice(0, 10);
  };

  const calcProgress = (list) => {
    if (!list.length) return 0;
    const completed = list.filter((t) => t.completed).length;
    return Math.round((completed / list.length) * 100);
  };

  const formatGanttData = () => {
    const projects = departments.map((dep, i) => ({
      id: `dep-${i}`,
      text: `${dep} Progress`,
      start_date: getMinDate(tasks),
      end_date: getMaxDate(tasks),
      type: "project",
      progress: calcProgress(tasks.filter((t) => t.department === dep)),
      open: true,
      readonly: true,
    }));

    const taskData = tasks.map((task) => ({
      ...task,
      parent: `dep-${departments.indexOf(task.department)}`,
    }));

    return [...projects, ...taskData];
  };

  useEffect(() => {
    gantt.config.columns = [
      { name: "text", label: "Task Name", width: "*", tree: true },
      { name: "start_date", label: "Start Date", align: "center" },
      { name: "duration", label: "Duration", align: "center" },
      { name: "owner", label: "Owner", align: "center" },
    ];

    gantt.config.scale_unit = "day";
    gantt.config.date_scale = "%d %M";
    gantt.config.drag_move = true;
    gantt.config.drag_resize = true;
    gantt.config.grid_width = 350;

    gantt.templates.task_class = (start, end, task) => {
      if (task.department === "Marketing") return "marketing-task";
      if (task.department === "Operations") return "operations-task";
      return "";
    };

    gantt.init(ganttRef.current);
    gantt.parse({ data: formatGanttData() });

    gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, start_date: task.start_date, duration: task.duration }
            : t
        )
      );
    });
  }, []);

  useEffect(() => {
    if (gantt.getState()) {
      gantt.clearAll();
      gantt.parse({ data: formatGanttData() });
    }
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    const id = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    const newItem = {
      ...newTask,
      id,
      progress: 0,
      completed: false,
    };
    setTasks((prev) => [...prev, newItem]);
    setNewTask({ text: "", owner: "", department: departments[0], start_date: "", duration: 1 });
  };
const handleInputChange = (field, value) => {
    setNewTask((prev) => ({ ...prev, [field]: value }));
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>Departments & Tasks</h2>
        {departments.map((dep) => (
          <div key={dep}>
            <h3>{dep}</h3>
            <ul>
              {tasks.filter((t) => t.department === dep).map((task) => (
                <li key={task.id}>
                  <label className={task.completed ? "completed" : ""}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                    />
                    {task.text} ({task.owner})
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <form onSubmit={addTask}>
          <h3>Add New Task</h3>
          <input
            type="text"
            placeholder="Task Name"
            value={newTask.text}
            onChange={(e) => handleInputChange("text", e.target.value)}
          />
          <input
            type="text"
            placeholder="Owner"
            value={newTask.owner}
            onChange={(e) => handleInputChange("owner", e.target.value)}
          />
          <select
            value={newTask.department}
            onChange={(e) => handleInputChange("department", e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="date"
            value={newTask.start_date}
            onChange={(e) => handleInputChange("start_date", e.target.value)}
          />
          <input
            type="number"
            min="1"
            value={newTask.duration}
            onChange={(e) => handleInputChange("duration", +e.target.value)}
          />
          <button type="submit">Add Task</button>
        </form>
      </aside>
      <main className="gantt-container" ref={ganttRef} style={{ width: "100%", height: "600px" }} />
    </div>
  );
};

export default GanttChartComponent;