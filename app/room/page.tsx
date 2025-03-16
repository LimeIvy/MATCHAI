"use client";
import { useState, useEffect } from "react";
import { ref, set, onValue } from "firebase/database";
import { v4 as uuidv4 } from "uuid"; // UUID 生成ライブラリ
import db from "@/firebaseConfig";

// ユーザーの UUID を取得（なければ新しく作る）
const getUserId = () => {
  if (typeof window !== "undefined") {
    // クライアントサイドでのみ実行されるように確認
    let userId = localStorage.getItem("userId");
    if (!userId) {
      userId = uuidv4(); // UUID を生成
      localStorage.setItem("userId", userId); // ローカルに保存
    }
    return userId;
  }
  return ""; // サーバーサイドの場合は空文字を返す
};

const generateRoomId = () => Math.floor(1000 + Math.random() * 9000).toString();

export default function RoomPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [inputRoomId, setInputRoomId] = useState("");
  const [position, setPosition] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });
  const [users, setUsers] = useState<{
    [key: string]: { latitude: number; longitude: number; role: string };
  }>({}); // role を追加
  const [userRole, setUserRole] = useState<string>("guest"); // ユーザーの役割（ホストかゲストか）
  const [userId, setUserId] = useState<string>("");

  // クライアントサイドでユーザーIDを取得
  useEffect(() => {
    const userId = getUserId();
    setUserId(userId); // ユーザーIDをstateにセット
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator && userId) {
      navigator.geolocation.watchPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ latitude, longitude });

        if (roomId) {
          set(ref(db, `rooms/${roomId}/users/${userId}`), {
            latitude,
            longitude,
            role: userRole,
          });
        }
      });
    }
  }, [roomId, userId, userRole]); // userRole も依存関係に追加

  const createRoom = () => {
    const newRoomId = generateRoomId();

    setRoomId(newRoomId);
    setUserRole("host"); // ホストとして参加
    alert(`ルームID: ${newRoomId}`);

    // ルームを作成し、ホストの情報を保存
    set(ref(db, `rooms/${newRoomId}`), {
      users: {
        [userId]: { latitude: null, longitude: null, role: "host" },
      },
    });
  };

  const joinRoom = () => {
    setRoomId(inputRoomId);

    onValue(ref(db, `rooms/${inputRoomId}`), (snapshot) => {
      const roomData = snapshot.val();

      if (!roomData) {
        alert("ルームは存在しません。");
        setRoomId(null);
        return;
      }


      // ゲストとして参加
      setUserRole("guest");
      setUsers(roomData.users); // ルームの参加者情報をセット
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold">位置情報ルーム</h1>

      {!roomId ? (
        <>
          <button
            onClick={createRoom}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            ルームを作る
          </button>
          <input
            type="text"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
            placeholder="ルームIDを入力"
            className="border p-2 mt-4"
          />
          <button
            onClick={joinRoom}
            className="px-4 py-2 bg-green-500 text-white rounded-md mt-2"
          >
            ルームに参加
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mt-4">ルームID: {roomId}</h2>
          <p>
            緯度: {position.latitude} / 
          </p>
          <p>
            経度: {position.longitude}
          </p>
          <h3 className="text-lg font-bold mt-4">参加者</h3>
          <ul>
            {Object.keys(users).map((key) => {
              const user = users[key];
              if (userId === key) return null;
              return (
                <li key={key}>
                  {user?.role === "host" ? (
                    <span className="text-red-500">ホスト</span>
                  ) : (
                    <span>ゲスト</span>
                  )}
                  {` 緯度: ${user?.latitude}, 経度: ${user?.longitude}`}
                </li>
              );
            })}
          </ul>

          {userRole === "host" && (
            <div className="mt-4">
              <p>あなたはホストです。</p>
            </div>
          )}

          {userRole === "guest" && (
            <div className="mt-4">
              <p>
                ホストの座標:
              </p>
              <p>
                緯度: {users[userId]?.latitude}
              </p>
              <p>
                経度: {users[userId]?.longitude}
              </p>

            </div>
          )}
        </>
      )}
    </div>
  );
}
