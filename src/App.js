import logo from './logo.svg';
import './App.css';
import React from "react";
import Home from './Component/Home';
import Main from './Screens/Main';
import { Route, Routes } from 'react-router-dom';
import User from './Screens/User';
import Login from './Screens/Login';
// import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
// import { CheckSquare, PlusCircle } from "lucide-react";
import { TaskProvider } from './context/TaskContext';
import SubAdmin from './Screens/SubAdmin';
import TaskManagementSystem from './Screens/TaskManagementSystem';
import Personal from './Screens/Personal';


function App() {
  return (
    <div className="App">
      {/* <Home/> */}
      {/* <Main/> */}
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/project' element={<Personal/>}/>
        <Route path='/user' element={
        <TaskProvider>
          <User />
        </TaskProvider>}/>
        <Route path='/admin' element={<Main/>}/>
        <Route path='/subadmin' element={<SubAdmin/>}/>
      </Routes>
    </div>
  );
}

export default App;
