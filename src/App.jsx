import { useState, useEffect, useRef } from "react";

function App() {
  const [findIndex, setFindIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  // Stopwatch state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [breaks, setBreaks] = useState([]);
  const [breakCount, setBreakCount] = useState(0);
  const intervalRef = useRef(null);
  const drawRandom = () => {
    const index = Math.floor(Math.random() * 10);
    setFindIndex(index);
    setHasDrawn(true);
  };

  const reset = () => {
    setHasDrawn(false);
  };
  
  // Stopwatch functions
  const startStopwatch = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };
  
  const pauseStopwatch = () => {
    if (isRunning) {
      setIsRunning(false);
      // Add a new break with current time
      const newBreakCount = breakCount + 1;
      setBreakCount(newBreakCount);
      setBreaks(prevBreaks => [...prevBreaks, { id: newBreakCount, time: formatTime() }]);
    }
  };
  
  const resetStopwatch = () => {
    setIsRunning(false);
    setTime(0);
    setBreaks([]);
    setBreakCount(0);
  };
  
  // Format time to display as MM:SS:MS
  const formatTime = () => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
  };
  
  // Effect for stopwatch
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const rewards = [
    "Do Nothing",
    "Watch Youtube",
    "Do Nothing",
    "Watch Movies",
    "Do Nothing",
    "Read a Book",
    "Do Nothing",
    "Scroll Social Media",
    "Do Nothing",
    "Read a Book",
  ];
  return (
    <>
      <div className="bg-gray-900 min-h-screen w-full flex justify-center relative">
        {/* Stopwatch in top right corner */}
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <div className="text-2xl font-mono mb-2 text-center">{formatTime()}</div>
          <div className="flex gap-2 mb-3">
            <button 
              onClick={startStopwatch} 
              className={`px-3 py-1 rounded ${isRunning ? 'bg-gray-300' : 'bg-green-500 text-white'}`}
              disabled={isRunning}
            >
              Start
            </button>
            <button 
              onClick={pauseStopwatch} 
              className={`px-3 py-1 rounded ${!isRunning ? 'bg-gray-300' : 'bg-yellow-500 text-white'}`}
              disabled={!isRunning}
            >
              Pause
            </button>
            <button 
              onClick={resetStopwatch} 
              className="px-3 py-1 rounded bg-red-500 text-white"
            >
              Reset
            </button>
          </div>
          
          {/* Break history */}
          {breaks.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <h3 className="text-sm font-semibold mb-1">Breaks:</h3>
              <div className="max-h-40 overflow-y-auto">
                {breaks.map(breakItem => (
                  <div key={breakItem.id} className="text-xs mb-1 flex">
                    <span className="font-medium">Break {breakItem.id}:</span>
                    <span className="ml-1">{breakItem.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-center">
          <div>
            <h1 className="lg:text-5xl font-bold text-white my-10 font-mono md:text-3xl sm: text-3xl">
              Draw your Reward
            </h1>
          </div>
          <div className="flex justify-center mb-6 gap-5 my-10">
            <button
              onClick={drawRandom}
              className="bg-white w-30 rounded-md p-3 text-black hover:bg-gray-300 transition-colors"
            >
              Draw
            </button>
            <button
              onClick={reset}
              className="bg-white rounded-md w-30 p-3 hover:bg-gray-3 00 transition-colors"
            >
              Reset
            </button>
          </div>
          {hasDrawn && (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-lg w-80 h-50 flex flex-col justify-center items-center">
              <h2 className="text-3xl font-semibold text-gray-800 mb-10">
                Your Reward
              </h2>
              <p className="text-2xl mt-2 text-gray-700 font-mono font-bold">{rewards[findIndex]}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
