import { supabase } from "../utils/supabase";

export const getAllClients = async () => {
  const userid = localStorage.getItem("id");
  const mydata = await supabase
    .from("user")
    .select("room_pass")
    .eq("id", userid)
    .single();

  const pass = mydata.data?.room_pass;

  // クライアント情報を取得
  const { data: clientsData, error: clientError } = await supabase
    .from("user")
    .select("*")
    .eq("room_pass", pass)
    .eq("role", "client");

  if (clientError) {
    return [];
  }

  return clientsData;
};

export const getRoomData = async () => {
  const userid = localStorage.getItem("id");
  const mydata = await supabase
    .from("user")
    .select("room_pass")
    .eq("id", userid)
    .single();

  const pass = mydata.data?.room_pass;

  const roomData = await supabase
    .from("room")
    .select("pass, name")
    .eq("pass", pass) // room_passが一致するユーザーをフィルタリング
    .single();
  return roomData.data;
};

export const getRealTimeClients = (callback: () => void) => {
  const subscription = supabase
    .channel("user_clients_changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "user" },
      () => {
        callback();
      }
    )
    .subscribe();

  return subscription;
};

export const addUser = async (name: string) => {
  const { data } = await supabase
    .from("user")
    .insert({ name: name })
    .select()
    .single();

  return data.id;
};

export const addRoom = async (pass: number, name: string) => {
  const userid = localStorage.getItem("id");

  await supabase.from("room").insert({ pass: pass, name: name });

  await supabase
    .from("user")
    .update({ room_pass: pass, role: "host", update_at: new Date() })
    .eq("id", userid);
};

export const generateRoomId = async () => {
  let roomid: number;
  let existingRoom: any;
  do {
    roomid = Math.floor(1000 + Math.random() * 9000);
    existingRoom = await supabase
      .from("room")
      .select("pass")
      .eq("pass", roomid)
      .single();
  } while (existingRoom.data); // 既に存在する場合は再生成

  return roomid;
};

export const joinRoom = async (pass: number) => {
  const userid = localStorage.getItem("id");
  await supabase
    .from("user")
    .update({ room_pass: pass, role: "client", update_at: new Date() })
    .eq("id", userid);

  await supabase
    .from("room")
    .update({ update_at: new Date() })
    .eq("pass", pass);
};

export const findPassword = async (password: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from("room")
    .select("pass")
    .eq("pass", password)
    .maybeSingle();
  if (error || !data) {
    return false;
  }
  return true;
};

export const isRoomLocking = async (password: number): Promise<boolean> => {
  const { data } = await supabase
    .from("room")
    .select("is_open")
    .eq("pass", password)
    .single(); // passが一致する1件のデータを取得

  await supabase
    .from("room")
    .update({ update_at: new Date() })
    .eq("pass", password);

  if (!data) {
    return false;
  } else {
    return data.is_open;
  }
};

export const CheckRole = async () => {
  const userid = localStorage.getItem("id");
  const { data } = await supabase
    .from("user")
    .select("role")
    .eq("id", userid)
    .single();
  return data?.role || null;
};

export const updateLocation = async (
  latitude: number,
  longitude: number,
  altitude: number
) => {
  const userid = localStorage.getItem("id");
  await supabase
    .from("user")
    .update({
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      update_at: new Date(),
    })
    .eq("id", userid);
};

export const getMyLocation = async () => {
  const userid = localStorage.getItem("id");
  const data = await supabase
    .from("user")
    .select("latitude, longitude, altitude")
    .eq("id", userid)
    .single();

  return data;
};

export const getHostLocation = async () => {
  const userid = localStorage.getItem("id");

  // room_passを取得
  const { data: mydata } = await supabase
    .from("user")
    .select("room_pass")
    .eq("id", userid)
    .single();

  const pass = mydata?.room_pass;

  // room_passがnullまたはundefinedの場合、nullを返す
  if (pass === null || pass === undefined) {
    return null;
  }

  // room_passが一致するホストの位置情報を取得
  const { data } = await supabase
    .from("user")
    .select("latitude, longitude, altitude")
    .eq("room_pass", pass) // room_passが一致するユーザーをフィルタリング
    .eq("role", "host") // roleが"host"であるユーザーを対象
    .single();

  return data;
};

// 自分 & ホストの位置情報を取得する関数（まとめて取得）
export const fetchLocations = async () => {
  const myLatestLocation = await getMyLocation();
  const hostLatestLocation = await getHostLocation();

  return {
    myLatitude: myLatestLocation?.data?.latitude || null,
    myLongitude: myLatestLocation?.data?.longitude || null,
    myAltitude: myLatestLocation?.data?.altitude || null,
    hostLatitude: hostLatestLocation?.latitude || null,
    hostLongitude: hostLatestLocation?.longitude || null,
    hostAltitude: hostLatestLocation?.altitude || null,
  };
};

export const GetRealTimeLocations = (callback: () => void) => {
  const subscription = supabase
    .channel("user_location_changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "user" },
      (payload) => {
        // 変更されたカラムをチェック
        const updatedColumns = Object.keys(payload.new);

        // latitude, longitude, altitude のいずれかが更新された場合のみ callback を実行
        if (
          updatedColumns.includes("latitude") ||
          updatedColumns.includes("longitude") ||
          updatedColumns.includes("altitude")
        ) {
          callback();
        }
      }
    )
    .subscribe();

  return subscription;
};

export const setDistance = async (distance: number) => {
  const userid = localStorage.getItem("id");
  await supabase
    .from("user")
    .update({ distance: distance, update_at: new Date() })
    .eq("id", userid);
};

export const ResetData = async () => {
  const userid = localStorage.getItem("id");
  await supabase
    .from("user")
    .update({
      latitude: null,
      longitude: null,
      altitude: null,
      distance: null,
      room_pass: null,
      role: null,
      update_at: new Date(),
    })
    .eq("id", userid);
};

// ユーザー設定の更新
export const updateUserSettings = async (
  userId: string,
  name: string,
  icon: string | null = null
) => {
  await supabase
    .from("user")
    .update({
      name: name,
      icon: icon,
      update_at: new Date(),
    })
    .eq("id", userId);
};

// ユーザー設定の取得
export const getUserSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user")
      .select("name, icon")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
};

// 画像のアップロード
export const uploadUserIcon = async (userId: string, file: File) => {
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${Math.random()}.${fileExt}`;

  // ファイルをアップロード
  await supabase.storage
    .from("icons")
    .upload(filePath, file);

  return filePath;
};