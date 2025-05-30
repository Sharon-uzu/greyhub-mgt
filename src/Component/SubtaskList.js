import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { ChevronDown, ChevronRight, Folder, Building, FileText } from 'lucide-react';

const Collapsible = ({ title, children, level = 0, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const indent = 16 * level;

  return (
    <div style={{ marginLeft: indent, marginBottom: 8 }}>
      <div
        onClick={() => children && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: children ? 'pointer' : 'default',
          fontWeight: 500,
          background: children ? '#f9f9f9' : 'transparent',
          padding: '8px 12px',
          borderRadius: 6,
          transition: 'background 0.2s',
        }}
      >
        {children && (
          <span style={{ marginRight: 6 }}>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
        {title}
      </div>
      {isOpen && <div style={{ paddingLeft: 8 }}>{children}</div>}
    </div>
  );
};

const SubtaskList = () => {
  const { subtasks } = useTaskContext();

  const groupedData = subtasks?.reduce((acc, subtask) => {
    const { project, department, task, subtask: subtaskTitle, createdBy } = subtask;

    if (!acc[project]) acc[project] = {};
    if (!acc[project][department]) acc[project][department] = {};
    if (!acc[project][department][task]) acc[project][department][task] = [];

    acc[project][department][task].push({ name: subtaskTitle, createdBy });

    return acc;
  }, {}) || {};

  return (
    <div style={{ margin: '0 auto', padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>📋 Subtask Overview</h2>

      {subtasks?.length === 0 ? (
        <div style={{ fontStyle: 'italic', color: '#777' }}>No subtasks found.</div>
      ) : (
        Object.entries(groupedData).map(([project, departments]) => (
          <Collapsible key={project} title={project} level={0} icon={<Folder size={16} />}>
            {Object.entries(departments).map(([department, tasks]) => (
              <Collapsible key={department} title={department} level={1} icon={<Building size={16} />}>
                {Object.entries(tasks).map(([taskName, subtaskList]) => (
                  <Collapsible key={taskName} title={taskName} level={2} icon={<FileText size={16} />}>
                    {subtaskList.map((sub, index) => (
                      <div
                        key={index}
                        style={{
                          marginLeft: 16,
                          padding: '6px 12px',
                          borderRadius: 6,
                          background: '#f3f4f6',
                          marginBottom: 6,
                          fontSize: 14,
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>{sub.name}</span>
                        <span style={{ fontStyle: 'italic', color: '#555' }}>By {sub.createdBy}</span>
                      </div>
                    ))}
                  </Collapsible>
                ))}
              </Collapsible>
            ))}
          </Collapsible>
        ))
      )}
    </div>
  );
};

export default SubtaskList;
