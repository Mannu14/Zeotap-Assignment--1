import React from 'react';
import { Toolbar } from './components/Toolbar';
import { Grid } from './components/Grid';

function App() {
  return (
    <div className="flex flex-col h-screen">
      <header className="bg-[#f8f9fa] border-b p-2">
        <h1 className="text-xl font-semibold text-gray-800">Manish Sheets</h1>
      </header>
      <Toolbar />
      <Grid />
    </div>
  );
}

export default App;