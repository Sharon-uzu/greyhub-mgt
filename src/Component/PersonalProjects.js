import React from 'react'
import SubtaskList from './SubtaskList'
import StaffsPersonalProjects from './StaffsPersonalProjects'

const PersonalProjects = () => {
  return (
    <div>
        <div className="personaltasks">
            <div className="subtaskslist">
                <div className="ssc">
                    <SubtaskList/>
                </div>
            </div>

            <div className="subtaskslist">
                <div className="ssc">
                    <StaffsPersonalProjects/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default PersonalProjects