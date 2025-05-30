import React, { useState, useEffect } from 'react';
import { Supabase } from '../config/supabase-config';
import { useCollapse } from 'react-collapsed';

const StaffsPersonalProjects = () => {
  const [groupedData, setGroupedData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await Supabase.from('staffs-projects').select('*');

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      const grouped = {};
      data.forEach(({ username, projects, task }) => {
        if (!grouped[username]) grouped[username] = {};
        if (!grouped[username][projects]) grouped[username][projects] = [];
        grouped[username][projects].push(task);
      });
      setGroupedData(grouped);
    };

    fetchData();
  }, []);

  return (
    <div className="staff-projects">
      <h2 style={{marginBottom:'8px'}}>Staffs Personal Projects</h2>

      {Object.keys(groupedData).length === 0 ? (
        <p>No staff projects available.</p>
      ) : (
        Object.entries(groupedData).map(([username, projects]) => (
          <CollapsibleGroup key={username} label={`Username: ${username}`}>
            {Object.entries(projects).map(([project, tasks]) => (
              <CollapsibleGroup key={project} label={`Project: ${project}`}>
                <ul>
                  {tasks.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </CollapsibleGroup>
            ))}
          </CollapsibleGroup>
        ))
      )}
    </div>
  );
};

const CollapsibleGroup = ({ label, children }) => {
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();
  return (
    <div className="collapsible-group">
      <div className="header" {...getToggleProps()}>
        {isExpanded ? '▼' : '▶'} {label}
      </div>
      <div {...getCollapseProps()}>
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

export default StaffsPersonalProjects;
