import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db, provider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { List, LogOut } from 'lucide-react';
import { FiCheck } from "react-icons/fi";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  updateDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  startTime: Timestamp;
  endTime?: Timestamp | null;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  const handleLogin = async () => {
    try {
      console.log("Attempting Google login...");
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful! User object:", result.user);
      console.log("Photo URL after login:", result.user.photoURL);
      setCurrentUser(result.user);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");
      await signOut(auth);
      setCurrentUser(null);
      setTodos([]);
      console.log("User logged out successfully.");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const fetchTodos = async (user: User) => {
    if (!user) {
      console.log("No user provided for fetching todos. Clearing todos.");
      setTodos([]);
      return;
    }
    try {
      console.log("Fetching todos for user ID:", user.uid);
      const q = query(
        collection(db, "todos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Todo, "id">),
      }));
      setTodos(data);
      console.log(`Workspaceed ${data.length} todos for user ${user.uid}.`);
    } catch (err) {
      console.error("Fetch todos error:", err);
    }
  };

  const handleAddTodo = async () => {
    if (!newTaskText.trim() || !currentUser) {
      console.log("Task text is empty or no user logged in. Cannot add todo.");
      return;
    }
    try {
      console.log("Adding new todo for user:", currentUser.uid);
      await addDoc(collection(db, "todos"), {
        userId: currentUser.uid,
        text: newTaskText.trim(),
        completed: false,
        createdAt: Timestamp.now(),
        startTime: Timestamp.now(),
        endTime: null,
      });
      setNewTaskText("");
      fetchTodos(currentUser);
      console.log("Todo added successfully.");
    } catch (err) {
      console.error("Add todo error:", err);
    }
  };

  const handleEndTodo = async (id: string) => {
    try {
      console.log(`Marking todo ${id} as completed...`);
      await updateDoc(doc(db, "todos", id), {
        completed: true,
        endTime: Timestamp.now(),
      });
      if (currentUser) {
        fetchTodos(currentUser);
      }
      console.log(`Todo ${id} marked as done.`);
    } catch (err) {
      console.error("End todo error:", err);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      console.log(`Deleting todo ${id}...`);
      await deleteDoc(doc(db, "todos", id));
      if (currentUser) {
        fetchTodos(currentUser);
      }
      console.log(`Todo ${id} deleted.`);
    } catch (err) {
      console.error("Delete todo error:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("onAuthStateChanged triggered. Current user:", user ? user.displayName : "No user");
      setCurrentUser(user);
      if (user) {
        console.log("Current user photoURL in useEffect:", user.photoURL);
        fetchTodos(user);
      } else {
        setTodos([]);
      }
    });

    return () => {
      console.log("Cleaning up auth state listener.");
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-left text-blue-600">
          📝 To-Do List
        </h1>

        {!currentUser ? (
          <div className="flex justify-center">
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {/* Google Icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.98 10.207C19.98 9.539 19.92 8.924 19.82 8.35H10.27V11.666H15.93C15.82 12.357 15.397 13.047 14.82 13.568C14.243 14.089 13.528 14.492 12.75 14.747L12.747 14.779L15.426 16.896L15.545 16.906C17.18 15.442 18.497 13.398 19.167 11.233C19.673 11.272 19.98 10.741 19.98 10.207Z" fill="#4285F4"/>
                <path d="M10.27 19.998C12.983 19.998 15.3 19.102 16.96 17.653L14.793 15.936C13.822 16.593 12.637 17.068 11.27 17.068C8.835 17.068 6.787 15.498 6.096 13.344L5.94 13.353L3.125 15.467L3.02 15.518C4.542 18.528 7.234 19.998 10.27 19.998Z" fill="#34A853"/>
                <path d="M5.94 13.344C5.666 12.518 5.518 11.603 5.518 10.666C5.518 9.729 5.666 8.814 5.94 7.988L5.932 7.822L3.056 5.67L3.02 5.688C2.062 7.643 1.518 9.07 1.518 10.666C1.518 12.262 2.062 13.689 3.02 15.518L5.94 13.344Z" fill="#FBBC05"/>
                <path d="M10.27 2.935C11.536 2.935 12.695 3.398 13.565 4.195L17.027 1.488C15.26 0.548 12.983 0 10.27 0C7.234 0 4.542 1.47 3.02 4.48L5.94 6.654C6.787 4.5 8.835 2.935 10.27 2.935Z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <img
                  src={
                    currentUser.photoURL ||
                    "https://www.gravatar.com/avatar/?d=mp&s=64&r=pg&f=1"
                  }
                  alt={currentUser.displayName || "Profile"}
                  className="w-10 h-10 rounded-full object-cover border border-gray-300"
                  onError={(e) => {
                    console.error("Error loading profile image. Falling back to default.", (e.target as HTMLImageElement).src);
                    (e.target as HTMLImageElement).src =
                      "https://www.gravatar.com/avatar/?d=mp&s=64&r=pg&f=1";
                  }}
                  key={currentUser.photoURL || "default-avatar"}
                />
                <span className="text-base font-medium text-gray-700">
                  Hello, {currentUser.displayName || "User"}
                </span>
              </div>
              <div className="flex items-center gap-4">
  <Link to="/summary" className="text-blue-600 text-sm hover:text-blue-800 flex items-center gap-1 group">
    <List className="w-4 h-4 group-hover:stroke-blue-800" /> {/* Menggunakan Lucide List icon */}
    <span>Task List</span> {/* Tambahkan teks "Summary" di sini */}
  </Link>
              <button
    onClick={handleLogout}
    className="text-red-500 text-sm hover:text-red-700 flex items-center gap-1 group"
  >
    <LogOut className="w-4 h-4 group-hover:stroke-red-700" /> {/* Menggunakan Lucide LogOut icon */}
    <span>Logout</span> {/* Tambahkan teks "Logout" di sini */}
  </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new task..."
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddTodo}
                className="bg-green-500 hover:bg-yellow-400 text-white font-medium px-5 py-2 rounded-md transition"
              >
                +Add
              </button>
            </div>

            <ul className="space-y-4">
              {todos.length === 0 && (
                <li className="text-center text-gray-500 italic">No tasks yet. Add one!</li>
              )}
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p
                        className={`text-base font-medium ${
                          todo.completed
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {todo.text}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Start: {todo.startTime.toDate().toLocaleString()}
                        <br />
                        End:{" "}
                        {todo.endTime
                          ? todo.endTime.toDate().toLocaleString()
                          : "-"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        ✕ Delete
                      </button>
                      {!todo.completed && (
                        <button
  onClick={() => handleEndTodo(todo.id)}
  className="bg-green-100 hover:bg-yellow-400 text-green text-xs p-2 rounded-md transition flex items-center justify-center"
>
  <FiCheck size={16} />
</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="text-center text-sm text-gray-500 mt-8">
          © 2025 Budi Ariyanto. Made with <span className="text-red-500">❤️</span>
        </div>
      </div>
    </div>
  );
}