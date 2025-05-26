import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db, provider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
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
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");

  // Handler untuk login dengan Google
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Log lengkap objek user setelah login
      console.log("User after login:", result.user);
      console.log("Photo URL after login:", result.user.photoURL); // Tambahan log
      setUser(result.user);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  // Handler untuk logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTodos([]); // Bersihkan todos saat logout
      console.log("User logged out successfully."); // Tambahan log
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Mengambil data todos dari Firestore
  const fetchTodos = async () => {
    if (!user) {
      setTodos([]); // Kosongkan todos jika tidak ada user
      return;
    }
    try {
      console.log("Fetching todos for user:", user.uid); // Tambahan log
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
      console.log("Todos fetched:", data.length); // Tambahan log
    } catch (err) {
      console.error("Fetch todos error:", err);
    }
  };

  // Menambahkan todo baru
  const handleAddTodo = async () => {
    if (!text.trim() || !user) return;
    try {
      await addDoc(collection(db, "todos"), {
        userId: user.uid,
        text: text.trim(),
        completed: false,
        createdAt: Timestamp.now(),
        startTime: Timestamp.now(),
        endTime: null,
      });
      setText("");
      fetchTodos(); // Refresh todos setelah penambahan
      console.log("Todo added successfully."); // Tambahan log
    } catch (err) {
      console.error("Add todo error:", err);
    }
  };

  // Menandai todo sebagai selesai
  const handleEndTodo = async (id: string) => {
    try {
      await updateDoc(doc(db, "todos", id), {
        completed: true,
        endTime: Timestamp.now(),
      });
      fetchTodos(); // Refresh todos setelah update
      console.log(`Todo ${id} marked as done.`); // Tambahan log
    } catch (err) {
      console.error("End todo error:", err);
    }
  };

  // Menghapus todo
  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, "todos", id));
      fetchTodos(); // Refresh todos setelah penghapusan
      console.log(`Todo ${id} deleted.`); // Tambahan log
    } catch (err) {
      console.error("Delete todo error:", err);
    }
  };

  // useEffect untuk memantau status autentikasi
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      console.log("onAuthStateChanged user:", u); // Log setiap kali status auth berubah
      setUser(u); // Perbarui state user
      if (u) {
        console.log("Current user photoURL in useEffect:", u.photoURL); // Log photoURL di sini
        fetchTodos(); // Ambil todos jika ada user
      } else {
        setTodos([]); // Kosongkan todos jika tidak ada user
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []); // Hanya dijalankan sekali saat komponen mount

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-left text-blue-600">
          📝 To-Do List
        </h1>

        {!user ? (
          <div className="text-center">
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {/* Bagian ini adalah kunci untuk menampilkan foto profil */}
                <img
                  src={
                    user.photoURL ||
                    "https://www.gravatar.com/avatar?d=mp&s=64&r=pg&f=1" // Fallback Gravatar dengan parameter yang lebih spesifik
                  }
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-300" // Sedikit perbesar ukuran untuk visibilitas
                  onError={(e) => {
                    // Log jika gambar gagal dimuat
                    console.error("Error loading profile image:", (e.target as HTMLImageElement).src);
                    (e.target as HTMLImageElement).src =
                      "https://www.gravatar.com/avatar?d=mp&s=64&r=pg&f=1"; // Fallback jika URL utama rusak
                  }}
                  // Tambahkan key untuk memaksa re-render jika URL berubah (jarang diperlukan tapi bisa membantu)
                  key={user.photoURL || "default-avatar"}
                />
                <span className="text-base font-medium text-gray-700">
                  Hello, {user.displayName || "User"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/summary" className="text-blue-600 text-sm underline hover:text-blue-800">
                  Summary
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-500 text-sm underline hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a new task..."
                className="border border-gray-300 rounded-md px-4 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddTodo}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2 rounded-md transition"
              >
                Add
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
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        ✕ Delete
                      </button>
                      {!todo.completed && (
                        <button
                          onClick={() => handleEndTodo(todo.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded-md transition"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}