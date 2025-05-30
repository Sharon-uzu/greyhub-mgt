import React, { useEffect, useRef, useState } from 'react';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import gantt from 'dhtmlx-gantt';
import { Supabase } from "../config/supabase-config";

const Gannt = ({ userId, username, userProjects, userTasks, fetchTasks }) => {
  const ganttContainer = useRef();
  const [selectedProject, setSelectedProject] = useState(userProjects[0]?.project || "");

  // Filter and map tasks for the selected project
  const getProjectTasks = () =>
    userTasks
      .filter((task) => task.project === selectedProject)
      .map((task) => ({
        id: task.id,
        text: task.task,
        start_date: new Date(task.start_date),
        end_date: new Date(task.end_date),
        status: task.status, // Used for checking if draggable
      }));

  // Update task date on drag/resize
  const handleTaskUpdate = async (id, task) => {
    try {
      await Supabase
        .from('Staff-tasks')
        .update({
          start_date: task.start_date.toISOString().split('T')[0],
          end_date: task.end_date.toISOString().split('T')[0],
        })
        .eq('id', id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task:', error.message);
    }
  };

  // Gantt setup on mount
  useEffect(() => {
    gantt.config.xml_date = "%Y-%m-%d %H:%i";
    gantt.config.readonly = false;
    gantt.config.drag_move = true;
    gantt.config.drag_resize = true;

    gantt.init(ganttContainer.current);

    // Prevent dragging/resizing if task is completed
    gantt.attachEvent("onBeforeTaskDrag", (id, mode, e) => {
      const task = gantt.getTask(id);
      return task.status !== 'completed';
    });

    gantt.attachEvent("onBeforeTaskResize", (id, mode, e) => {
      const task = gantt.getTask(id);
      return task.status !== 'completed';
    });

    gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
      handleTaskUpdate(id, task);
    });

    return () => gantt.clearAll();
  }, []);

  // Reload tasks when project or data changes
  useEffect(() => {
    gantt.clearAll();
    gantt.parse({ data: getProjectTasks() });
  }, [selectedProject, userTasks]);

  // Progress bar calculation
  const calculateProjectProgress = () => {
    return userProjects.map((project) => {
      const tasks = userTasks.filter((task) => task.project === project.project);
      const total = tasks.length;
      const completed = tasks.filter((task) => task.status === 'completed').length;
      const progress = total ? (completed / total) * 100 : 0;
      return { ...project, progress };
    });
  };

  return (
    <div>
      {/* Progress bars */}
      {calculateProjectProgress().map((project) => (
        <div key={project.id} style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', fontSize:'23px', marginBottom:'10px' }}>{project.project}</div>
          <div style={{ background: '#eee', borderRadius: '10px', height: '10px', width: '100%' }}>
            <div
              style={{
                width: `${project.progress}%`,
                background: '#4caf50',
                height: '100%',
                borderRadius: '4px'
              }}
            ></div>
          </div>
          <div style={{ fontSize: '14px', marginBottom: '5px' }}>
            {project.progress.toFixed(1)}% completed
          </div>
        </div>
      ))}

      {/* Project select */}
      {userProjects.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <label>Choose Project: </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{padding:'5px 14px', borderRadius:'15px'}}
          >
            {userProjects.map((project) => (
              <option key={project.id} value={project.project}>
                {project.project}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Gantt chart */}
      <div ref={ganttContainer} style={{ width: '100%', height: '500px' }}></div>
    </div>
  );
};

export default Gannt;
