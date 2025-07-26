import { useState } from "react";

function App() {
  const [findIndex, setFindIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);
  const drawRandom = () => {
    const index = Math.floor(Math.random() * 10);
    setFindIndex(index);
    setHasDrawn(true);
  };

  const reset = () => {
    setHasDrawn(false);
  };

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
      <div className="bg-gray-900 min-h-screen w-full flex justify-center">
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
