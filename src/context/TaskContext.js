// TaskContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supabase } from '../config/supabase-config';

const TaskContext = createContext();

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tasks
  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await Supabase
      .from("gantt-tasks")
      .select("*")
      .order("startDate", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } else {
      setTasks(data);
    }
    setLoading(false);
  };

  const addTask = async (newTask) => {
    const { title, startDate, endDate, project_id, dept_id, assignedTo } = newTask;
  
    const { data, error } = await Supabase
      .from("gantt-tasks")
      .insert([
        {
          title,
          startDate,
          endDate,
          project_id,
          dept_id,
          assignedTo,
          checked: false // default to unchecked
        }
      ]);
  
    if (error) {
      console.error("Error adding task:", error);
      return false;
    }
  
    // Update local state
    setTasks((prevTasks) => [...prevTasks, ...data]);
    return true;
  };
  

  const deleteTask = async (taskId) => {
    try {
      // Delete related subtasks first
      const { error: subtaskError } = await Supabase
        .from("gantt-subtasks")
        .delete()
        .eq("task_id", taskId);
  
      if (subtaskError) {
        console.error("Error deleting subtasks:", subtaskError);
        return false;
      }
  
      // Then delete the main task
      const { error: taskError } = await Supabase
        .from("gantt-tasks")
        .delete()
        .eq("id", taskId);
  
      if (taskError) {
        console.error("Error deleting task:", taskError);
        return false;
      }
  
      // Refresh tasks
      fetchTasks();
      return true;
    } catch (err) {
      console.error("Unexpected error deleting task:", err);
      return false;
    }
  };
  
  
  const [subtasks, setSubtasks] = useState([]);

  const fetchSubtasks = async () => {
    const { data, error } = await Supabase
      .from("gantt-subtasks")
      .select("*");
  
    if (error) {
      console.error("Error fetching subtasks:", error);
      setSubtasks([]);
    } else {
      setSubtasks(data);
    }
  };
  
  useEffect(() => {
    fetchTasks();
    fetchSubtasks(); // Add this
  }, []);
  


  
  // Update task checked status
  const updateTaskChecked = async (taskId, checked) => {
    const { error } = await Supabase
      .from("gantt-tasks")
      .update({ checked })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      return false;
    }

    // Update local state immediately for better UX
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, checked } : task
      )
    );
    
    return true;
  };

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, []);

  const value = {
    tasks,
    loading,
    fetchTasks,
    updateTaskChecked,
    deleteTask,
    addTask,
    setTasks,
    subtasks,        
    fetchSubtasks,   
    setSubtasks,
  };
  

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};