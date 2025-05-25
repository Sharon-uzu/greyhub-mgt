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
    setTasks
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};