import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { query, collection, where, orderBy, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";
import { Link } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Calendar,
  Timer,
  Trophy,
  TrendingUp,
  User as UserIcon
} from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Timestamp;
  startTime: Timestamp;
  endTime?: Timestamp | null;
}

interface Stats {
  total: number;
  completed: number;
  ongoing: number;
  totalDuration: number;
  averageDuration: number;
  completionRate: number;
}

export default function Summary() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    ongoing: 0,
    totalDuration: 0,
    averageDuration: 0,
    completionRate: 0
  });

  const calculateDuration = (startTime: Timestamp, endTime: Timestamp | null | undefined): string => {
    if (endTime === null || typeof endTime === 'undefined') {
      return "Ongoing...";
    }

    const start = startTime.toDate();
    const end = endTime.toDate();
    const durationMillis = end.getTime() - start.getTime();

    if (durationMillis <= 0) {
      return "0s";
    }

    const seconds = Math.floor(durationMillis / 1000);
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if ((seconds < 60 && remainingSeconds > 0) || parts.length === 0) {
      parts.push(`${remainingSeconds}s`);
    }

    return parts.length > 0 ? parts.join(' ') : "0s";
  };

  const calculateStats = (todoList: Todo[]): Stats => {
    const total = todoList.length;
    const completed = todoList.filter(t => t.completed).length;
    const ongoing = total - completed;
    
    let totalDuration = 0;
    const completedTodos = todoList.filter(t => t.completed && t.endTime);
    
    completedTodos.forEach(todo => {
      if (todo.endTime) {
        const duration = todo.endTime.toDate().getTime() - todo.startTime.toDate().getTime();
        totalDuration += duration;
      }
    });

    const averageDuration = completedTodos.length > 0 ? totalDuration / completedTodos.length : 0;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      ongoing,
      totalDuration,
      averageDuration,
      completionRate
    };
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        fetchTodos(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchTodos = async (uid: string) => {
    setLoading(true);
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
      setStats(calculateStats(data));
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 flex flex-col items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your task summary</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your task summary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Task Analytics
                </h1>
                <p className="text-gray-600">Comprehensive overview of your productivity</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Ongoing Tasks */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-3xl font-bold text-orange-600">{stats.ongoing}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">{stats.completionRate.toFixed(0)}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {stats.completed > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Timer className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-800">Time Analytics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Time Spent</span>
                  <span className="font-semibold text-gray-800">{formatDuration(stats.totalDuration)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Task Duration</span>
                  <span className="font-semibold text-gray-800">{formatDuration(stats.averageDuration)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-800">Productivity Score</h3>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  stats.completionRate >= 80 ? 'text-green-600' :
                  stats.completionRate >= 50 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {stats.completionRate >= 80 ? '🚀' : stats.completionRate >= 50 ? '📈' : '💪'}
                </div>
                <p className="text-gray-600">
                  {stats.completionRate >= 80 ? 'Excellent productivity!' :
                   stats.completionRate >= 50 ? 'Good progress!' : 'Room for improvement!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-800">Task History</h3>
          </div>

          {todos.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Found</h4>
              <p className="text-gray-500 mb-6">Start adding tasks on the Home page to see your analytics!</p>
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Home
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {todos.map((todo, i) => (
                      <tr key={todo.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {i + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 max-w-xs">
                          <div className="truncate" title={todo.text}>
                            {todo.text}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {todo.startTime.toDate().toLocaleDateString()} 
                            <br />
                            <span className="text-xs text-gray-400">
                              {todo.startTime.toDate().toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {todo.endTime ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              {todo.endTime.toDate().toLocaleDateString()}
                              <br />
                              <span className="text-xs text-gray-400">
                                {todo.endTime.toDate().toLocaleTimeString()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-600">
                              <AlertCircle className="w-3 h-3" />
                              <span className="italic text-xs">Ongoing</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {calculateDuration(todo.startTime, todo.endTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            todo.completed
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {todo.completed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                Ongoing
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 bg-white/50 backdrop-blur-sm rounded-xl p-4">
          <p>© 2025 Budi Ariyanto. Task Analytics Dashboard</p>
        </div>
      </div>
    </div>
  );
}