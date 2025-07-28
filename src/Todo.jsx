import { useState, useEffect } from "react";

function Todo() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (input.trim() === "") return;
    setTodos([
      ...todos,
      { id: Date.now(), text: input, completed: false },
    ]);
    setInput("");
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const startEdit = (id, text) => {
    setEditId(id);
    setEditValue(text);
  };

  const saveEdit = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, text: editValue } : todo
      )
    );
    setEditId(null);
    setEditValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  // The Todo Card UI
  const todoCard = (
    <div className="w-[100%] max-w-xs sm:max-w-sm md:max-w-md bg-white rounded-lg shadow-lg p-4 flex flex-col gap-2">
      <h2 className="text-lg font-bold mb-2 text-gray-800">Daily Todos</h2>
      <div className="flex gap-2 mb-2">
        <input
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          type="text"
          placeholder="Add a todo..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-blue-500 cursor-pointer text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
          onClick={addTodo}
        >
          Add
        </button>
      </div>
      <ul className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {todos.length === 0 && (
          <li className="text-gray-400 text-sm text-center">No todos yet!</li>
        )}
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="accent-blue-500 cursor-pointer"
            />
            {editId === todo.id ? (
              <>
                <input
                  className="flex-1 border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => saveEdit(todo.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                  }}
                  autoFocus
                />
                <button
                  className="text-xs cursor-pointer text-green-600 font-bold px-1"
                  onClick={() => saveEdit(todo.id)}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex-1 text-sm ${todo.completed ? "line-through text-gray-400" : "text-gray-800"}`}
                  onDoubleClick={() => startEdit(todo.id, todo.text)}
                  title="Double click to edit"
                >
                  {todo.text}
                </span>
                <button
                  className="text-xs cursor-pointer text-red-500 font-bold px-1"
                  onClick={() => deleteTodo(todo.id)}
                  title="Delete"
                >
                  Delete
                </button>
                <button
                  className="text-xs cursor-pointer text-blue-500 font-bold px-1"
                  onClick={() => startEdit(todo.id, todo.text)}
                  title="Edit"
                >
                  Edit
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      {/* For small screens: show floating + button, open modal */}
      <div className="sm:hidden fixed left-4 bottom-4 z-30">
        <button
          className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-700 transition-all duration-150 p-0"
          onClick={() => setShowModal(true)}
          aria-label="Open Todo Modal"
        >
          <span className="flex items-center justify-center w-full h-full" style={{lineHeight: 1}}>+</span>
        </button>
        {showModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="relative w-[90%] max-w-xs sm:max-w-sm md:max-w-md">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold z-50"
                onClick={() => setShowModal(false)}
                aria-label="Close Todo Modal"
              >
                &times;
              </button>
              <div className="mt-6">{todoCard}</div>
            </div>
          </div>
        )}
      </div>
      {/* For screens sm and up: show card always */}
      <div className="hidden sm:block fixed left-4 bottom-4 z-20 lg:left-8 lg:bottom-8">
        {todoCard}
      </div>
    </>
  );
}

export default Todo;
