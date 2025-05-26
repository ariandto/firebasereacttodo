import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { query, collection, where, orderBy, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";
import { Link } from "react-router-dom";
import { Timestamp } from "firebase/firestore";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  startTime: Timestamp;
  endTime?: Timestamp | null; // Tetap seperti ini jika memang bisa undefined dari Firestore
}

export default function Summary() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  // --- REVISI FUNGSI CALCULATE DURATION: Ubah tipe endTime untuk menerima undefined ---
  const calculateDuration = (startTime: Timestamp, endTime: Timestamp | null | undefined): string => {
    // Karena sekarang endTime bisa undefined, kita perlu mengecek keduanya
    if (endTime === null || typeof endTime === 'undefined') {
      return "Ongoing..."; // Jika tugas belum selesai atau endTime tidak ada
    }

    const start = startTime.toDate(); // Konversi ke objek Date
    const end = endTime.toDate();     // Konversi ke objek Date

    // Hitung perbedaan dalam milidetik
    const durationMillis = end.getTime() - start.getTime();

    // Jika durasi negatif atau sangat kecil (misal, < 1 detik)
    if (durationMillis <= 0) {
      return "0s"; // Menampilkan 0 detik jika durasi sangat singkat atau tidak valid
    }

    const seconds = Math.floor(durationMillis / 1000);

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts: string[] = [];
    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    // Tampilkan detik hanya jika durasi total kurang dari 1 menit
    // atau jika tidak ada bagian lain (hari, jam, menit) yang ditampilkan
    if ((seconds < 60 && remainingSeconds > 0) || parts.length === 0) {
        parts.push(`${remainingSeconds}s`);
    }

    return parts.length > 0 ? parts.join(' ') : "0s"; // Pastikan selalu ada output, default 0s
  };
  // --- AKHIR REVISI FUNGSI CALCULATE DURATION ---

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) fetchTodos(u.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchTodos = async (uid: string) => {
    const q = query(
      collection(db, "todos"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    try {
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Todo, "id">),
      }));
      setTodos(data);
    } catch (error) {
      console.error("Error fetching todos:", error);
      // Handle error, maybe show a message to the user
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8 px-4 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center transition-colors duration-300">
          <p className="text-xl text-red-600 dark:text-red-400 mb-4">Please log in to view summary.</p>
          <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-200">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h2 className="text-3xl font-extrabold text-blue-700 dark:text-blue-400">
            📋 To-Do Summary
          </h2>
          <Link
            to="/"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium underline"
          >
            ← Back to Home
          </Link>
        </div>

        {todos.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 text-lg italic">
            No tasks found for your account. Start adding tasks on the Home page!
          </div>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    No
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Start Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    End Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {todos.map((todo, i) => (
                  <tr key={todo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-800 dark:text-gray-200">
                      {todo.text}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {todo.startTime.toDate().toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {todo.endTime?.toDate().toLocaleString() || <span className="italic">Not ended yet</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {/* Pastikan pemanggilan calculateDuration juga konsisten dengan tipe baru */}
                      {calculateDuration(todo.startTime, todo.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        todo.completed
                          ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                      }`}>
                        {todo.completed ? "Completed" : "Ongoing"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}