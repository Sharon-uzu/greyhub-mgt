import { useState, useEffect } from "react";
import { Supabase } from "../config/supabase-config";

export default function EditProjectModal({ isOpen, onClose, project, refreshProjects }) {
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setProjectName(project.project || '');
    }
  }, [project]);

  const handleEditProject = async () => {
    if (!project || !project.id || !projectName) return;

    setLoading(true);
    try {
      // Update in Staff-project
      const { error: projectError } = await Supabase
        .from('Staff-project')
        .update({ project: projectName })
        .eq('id', project.id);
      if (projectError) throw projectError;

      // Update in Staff-tasks
      const { error: taskError } = await Supabase
        .from('Staff-tasks')
        .update({ project: projectName })
        .eq('project_id', project.id);
      if (taskError) throw taskError;

      // Update in Staff-subtasks
      const { error: subtaskError } = await Supabase
        .from('Staff-subtasks')
        .update({ project: projectName })
        .eq('project_id', project.id);
      if (subtaskError) throw subtaskError;

      alert("Project updated successfully!");
      onClose();
      refreshProjects(); // refetch projects and dependent data
      window.location.reload();

    } catch (err) {
      console.error("Error updating project:", err.message);
      alert("Failed to update project.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Edit Project</h2>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter new project name"
          style={{width:'100%', padding:'5px', height:'40px', marginTop:'12px', borderRadius:'10px'}}
        />
        <div style={{ marginTop: '1rem' }}>
          <button onClick={handleEditProject} disabled={loading}
            style={{padding:'5px 12px', height:'35px', backgroundColor:'#000',  color:'#fff', fontSize:'16px', fontWeight:'500', borderRadius:'10px'}}

          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose}      
          style={{padding:'5px 12px',marginLeft:'1rem', height:'35px', backgroundColor:'#000', color:'#fff', fontSize:'16px', fontWeight:'500', borderRadius:'10px'}}
        >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
