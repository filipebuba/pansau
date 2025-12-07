import React from 'react';
import CalculatorForm from './components/CalculatorForm';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      <main className="py-10">
        <CalculatorForm />
      </main>
      <footer className="text-center py-6 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} SmartBuild Calc MVP. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;