import React, { useEffect, useState } from "react";
import { useTaskContext } from "../context/TaskContext";

const Card = ({ children }) => <div className="card">{children}</div>;

const DepartmentProgressBars = () => {
  const { tasks, loading } = useTaskContext();
  const [progressData, setProgressData] = useState([]);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("ganttUser"));
    const username = loggedInUser?.username || "";

    if (!loading && tasks.length > 0) {
      // Filter tasks only involving current user
      const userTasks = tasks.filter(task => task.assignedTo === username);

      // Group user tasks by department + project
      const grouped = {};

      userTasks.forEach((task) => {
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

      // Format into array
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

  if (loading) return <p>Loading department progress...</p>;

  return (
    <div className="dept-progress-bar">
      <Card>
        {progressData.map(({ department, project, percent }) => (
          <div className="dept-progress-bar-divider" key={`${department}-${project}`}>
            <h2>
              {project} <span>({department})</span>
            </h2>
            <div className="progress-label">{percent}% Completed</div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${percent}%` }}></div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default DepartmentProgressBars;
