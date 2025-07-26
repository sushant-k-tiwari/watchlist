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
    const index = Math.floor(Math.random() * 15);
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
      setBreaks((prevBreaks) => [
        ...prevBreaks,
        { id: newBreakCount, time: formatTime() },
      ]);
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

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
  };

  // Effect for stopwatch
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 10);
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
    "Social Media",
    "Do Nothing",
    "Read a Book",
    "Watch Series",
    "Do Nothing",
    "Work on Fun Projects",
    "Do Nothing",
    "Work on Fun Projects",
  ];
  return (
    <>
      <div className="bg-gray-900 min-h-screen w-full flex justify-center relative">
        {/* Stopwatch - bottom right on mobile and md, top right only on desktop */}
        <div className="absolute bottom-4 right-4 md:bottom-4 md:right-4 lg:bottom-auto lg:top-4 bg-white p-3 sm:p-4 rounded-lg shadow-lg w-[90%] max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-xs z-10">
          <div className="text-xl sm:text-2xl font-mono mb-2 text-center">
            {formatTime()}
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 mb-3 justify-center">
            <button
              onClick={startStopwatch}
              className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base ${
                isRunning ? "bg-gray-300" : "bg-green-500 text-white"
              }`}
              disabled={isRunning}
            >
              Start
            </button>
            <button
              onClick={pauseStopwatch}
              className={`px-2 sm:px-3 py-1 rounded text-sm sm:text-base ${
                !isRunning ? "bg-gray-300" : "bg-yellow-500 text-white"
              }`}
              disabled={!isRunning}
            >
              Pause
            </button>
            <button
              onClick={resetStopwatch}
              className="px-2 sm:px-3 py-1 rounded text-sm sm:text-base bg-red-500 text-white"
            >
              Reset
            </button>
          </div>

          {/* Break history - responsive */}
          {breaks.length > 0 && (
            <div className="mt-2 border-t pt-2">
              <h3 className="text-xl sm:text-md font-semibold mb-1">Breaks:</h3>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto">
                {breaks.map((breakItem) => (
                  <div
                    key={breakItem.id}
                    className="text-[10px] sm:text-md font-mono mb-1 flex flex-wrap sm:flex-nowrap"
                  >
                    <span className="text-sm font-mono">
                      Break {breakItem.id}:
                    </span>
                    <span className="ml-1 text-sm">{breakItem.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 mt-16 sm:mt-10 md:mt-0 mb-32 sm:mb-32 md:mb-32 lg:mb-0">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white my-6 sm:my-8 md:my-10 font-mono text-center">
              Draw your Reward
            </h1>
          </div>
          <div className="flex justify-center mb-4 sm:mb-6 gap-3 sm:gap-5 my-6 sm:my-8 md:my-10">
            <button
              onClick={drawRandom}
              className="bg-white rounded-md px-4 py-2 sm:p-3 text-sm sm:text-base text-black hover:bg-gray-300 transition-colors w-[100px]"
            >
              Draw
            </button>
            <button
              onClick={reset}
              className="bg-white rounded-md px-4 py-2 sm:p-3 text-sm sm:text-base hover:bg-gray-300 transition-colors w-[100px]"
            >
              Reset
            </button>
          </div>
          {hasDrawn && (
            <div className="mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-lg w-[90%] max-w-xs sm:max-w-sm md:max-w-md flex flex-col justify-center items-center">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-800 mb-4 sm:mb-6 md:mb-10">
                Your Reward
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl mt-2 text-gray-700 font-mono font-bold text-center">
                {rewards[findIndex]}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
