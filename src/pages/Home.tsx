import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db, provider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { List, LogOut, Plus, Check, Trash2, Clock } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log("Attempting Google login...");
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful! User object:", result.user);
      console.log("Photo URL after login:", result.user.photoURL);
      setCurrentUser(result.user);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
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
      console.log(`Fetched ${data.length} todos for user ${user.uid}.`);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
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

  const completedTodos = todos.filter(todo => todo.completed);
  const activeTodos = todos.filter(todo => !todo.completed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            ✨ ToDoApp
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Stay organized, Your Own Task</p>
        </div>

        {!currentUser ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ToDoApp</h2>
                <p className="text-gray-600">Sign in to manage your tasks efficiently</p>
              </div>
              
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {/* Modern Google Icon */}
                <div className="w-5 h-5 flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="group-hover:text-gray-900 transition-colors">
                  {isLoading ? 'Signing in...' : 'Continue with Google'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.photoURL || "https://www.gravatar.com/avatar/?d=mp&s=64&r=pg&f=1"}
                      alt={currentUser.displayName || "Profile"}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-lg"
                      onError={(e) => {
                        console.error("Error loading profile image. Falling back to default.", (e.target as HTMLImageElement).src);
                        (e.target as HTMLImageElement).src = "https://www.gravatar.com/avatar/?d=mp&s=64&r=pg&f=1";
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                      Welcome back, {currentUser.displayName?.split(' ')[0] || "User"}! 👋
                    </h3>
                    <p className="text-sm text-gray-500">
                      {activeTodos.length} active tasks • {completedTodos.length} completed
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link 
                    to="/summary" 
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 text-sm font-medium"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">Task List</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Add Task Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                Add New Task
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What needs to be done?"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm placeholder-gray-500 text-gray-800"
                />
                <button
                  onClick={handleAddTodo}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl sm:min-w-fit"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Tasks Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Tasks */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Active Tasks ({activeTodos.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activeTodos.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 italic">No active tasks. Great job! 🎉</p>
                    </div>
                  ) : (
                    activeTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 hover:shadow-md"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium mb-2 break-words">
                              {todo.text}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Started: {todo.startTime.toDate().toLocaleDateString()} at {todo.startTime.toDate().toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleEndTodo(todo.id)}
                              className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-all duration-200 flex items-center justify-center group"
                              title="Mark as complete"
                            >
                              <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-200 flex items-center justify-center group"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Completed Tasks */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  Completed Tasks ({completedTodos.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {completedTodos.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 italic">No completed tasks yet</p>
                    </div>
                  ) : (
                    completedTodos.map((todo) => (
                      <div
                        key={todo.id}
                        className="bg-green-50/70 backdrop-blur-sm p-4 rounded-xl border border-green-100 hover:border-green-200 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600 font-medium mb-2 line-through break-words">
                              {todo.text}
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Started: {todo.startTime.toDate().toLocaleDateString()} at {todo.startTime.toDate().toLocaleTimeString()}
                              </p>
                              <p className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-green-500" />
                                Completed: {todo.endTime ? `${todo.endTime.toDate().toLocaleDateString()} at ${todo.endTime.toDate().toLocaleTimeString()}` : "-"}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-all duration-200 flex items-center justify-center group flex-shrink-0"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-4">
          <p>© 2025 Budi Ariyanto. Made with <span className="text-red-500 animate-pulse">❤️</span> and modern design</p>
        </div>
      </div>
    </div>
  );
}