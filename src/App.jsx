import { useState } from "react";

function App() {
  const [findIndex, setFindIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState(false);

  const movieList = [
    "Iron Mask",
    "Companion",
    "Scorpion",
    "Kiss Kiss Bang Bang",
    "Family Matters(K-Drama)",
    "Only the Brave",
    "Forgotten(K-Drama)",
    "Sunday",
    "Prime Target",
    "Get Out",
    "Remember Me",
    "A little Reunion(K-Drama)",
    "Gigi & Nate",
    "Shameless",
    "The layover",
    "The Guest",
    "Front of the Class",
    "What Women Want",
    "Love Scout(K-Drama)",
    "G-Force",
    "Bhagwan Bharose",
    "The Gambler",
    "Family by Choice(K-Drama)",
    "Alienoid",
    "The Darjeeling Limited",
    "From",
    "Cashback",
    "How to build a better boy?",
    "Zombies",
    "Ted Lasso",
    "Under Ninja found it",
    "Brewing Love",
    "A Series of Unfortunate Events",
    "Green Book",
    "Mr. Deeds",
    "Time Bandits",
    "Tatlubaaz",
    "I Not Stupid 3",
    "Kim’s Convenience",
    "Hometown Cha Cha Cha(K-Drama)",
    "Queen of Tears(K-Drama)",
    "You",
    "The Uncanny Encounter(K-Drama)",
    "Vincenzo(K-Drama)",
    "Alice in Borderland(J-Drama)",
    "Rick and Morty",
    "Hierarchy(K-Drama)",
    "Tale of the Nine Tailed(K-Drama)",
    "Lucifer",
    "Squid Game(K-Drama)",
    "Money Hiest",
    "Dark",
    "Fairy Tale",
    "The Sandman",
    "The Witcher",
    "Titans",
    "Hi Papa",
    "Lift",
    "The Playlist",
    "Another Life",
    "The Last of Us",
    "Aquaman 2",
    "Inglorius Bastards",
    "Fight Club",
    "The Studio",
    "The Wild Robot",
    "Edge of Tomorrow",
    "Ant man and the Wasp",
    "Guardian of the Galaxy 3",
    "X-Men’97",
    "Anora",
    "The Boys",
    "Gen V",
  ];

  const drawRandom = () => {
    const randomIndex = Math.floor(Math.random() * movieList.length);
    setFindIndex(randomIndex);
    setHasDrawn(true);
  };

  const reset = () => {
    setHasDrawn(false);
    setFindIndex(0);
  };
  return (
    <>
      <div className="bg-[url('./assets/wallpaper.jpg')] bg-cover bg-no-repeat bg-center min-h-screen w-full">
        <div className="flex flex-col items-center px-4 sm:px-6 md:px-8 mt-16 sm:mt-10 md:mt-0 mb-32 sm:mb-32 md:mb-32 lg:mb-0">
          <div className="self-start">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white my-6 sm:my-8 md:my-10 font-mono text-left">
              Watch Next
            </h1>
          </div>

          <div className="flex justify-center mb-4 sm:mb-6 gap-3 sm:gap-5 my-6 sm:my-8 md:my-10">
            <button
              onClick={drawRandom}
              className="bg-white cursor-pointer rounded-md px-4 py-2 sm:p-3 text-sm sm:text-base text-black hover:bg-gray-300 transition-colors w-[100px]"
            >
              Draw
            </button>
            <button
              onClick={reset}
              className="bg-white cursor-pointer rounded-md px-4 py-2 sm:p-3 text-sm sm:text-base hover:bg-gray-300 transition-colors w-[100px]"
            >
              Reset
            </button>
          </div>
          {hasDrawn && (
            <div
              className="mt-4 sm:mt-6 md:mt-8 p-4 sm:p-6 rounded-lg shadow-lg w-[90%] max-w-xs h-[250px] sm:max-w-sm md:max-w-md flex flex-col justify-center items-center
            bg-white/10 backdrop-blur-sm border border-white/30 text-white"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6 md:mb-10">
                Watch This
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl mt-2 font-mono font-bold text-center">
                {movieList[findIndex]}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
