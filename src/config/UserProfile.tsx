

type UserProfileProps = {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  };
};

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="flex items-center gap-4 p-2 border rounded-lg bg-gray-50">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt="Profile"
          className="w-12 h-12 rounded-full border object-cover"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold">
          {user.displayName?.[0] || "U"}
        </div>
      )}
      <div>
        <p className="font-semibold">{user.displayName ?? "User"}</p>
        <p className="text-xs text-gray-500">{user.email ?? "-"}</p>
      </div>
    </div>
  );
}

