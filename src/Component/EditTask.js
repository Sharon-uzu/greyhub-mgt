import { useState, useEffect } from 'react';
import { Supabase } from "../config/supabase-config";

export default function EditTask({ isOpen, onClose, task, refreshTasks }) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.task || '');  // assumes "task" column stores the title
    }
  }, [task]);

  const handleEditTask = async () => {
    if (!task || !task.id) return;
    setLoading(true);
    try {
      const { error: taskError } = await Supabase
        .from('Staff-tasks')
        .update({ task: title })  // ✅ FIXED
        .eq('id', task.id);

      if (taskError) throw taskError;

      const { error: subtaskError } = await Supabase
        .from('Staff-subtasks')
        .update({ task: title }) // only if you also store task title in subtasks
        .eq('task_id', task.id);

      if (subtaskError) throw subtaskError;

      alert('Task updated successfully!');
      onClose();
      refreshTasks();
    } catch (err) {
      console.error('Error updating task:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit Task</h2>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter new task title"
          style={{width:'100%', padding:'5px', height:'40px', marginTop:'6px', borderRadius:'10px'}}

        />
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleEditTask} disabled={loading}
            style={{padding:'5px 12px', height:'35px', backgroundColor:'#000', color:'#fff', fontSize:'16px', fontWeight:'500', borderRadius:'10px'}}

          >
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button  onClick={onClose} 
          style={{padding:'5px 12px', height:'35px', backgroundColor:'#000', marginLeft: '1rem', color:'#fff', fontSize:'16px', fontWeight:'500', borderRadius:'10px'}}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
