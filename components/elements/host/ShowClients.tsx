"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react'

import { getAllClients, getRealTimeClients} from '@/utils/supabaseFunction';

import useGeolocation from '@/customhooks/useGeolocation';

import { IoLocationOutline } from 'react-icons/io5';

const ShowClients = () => {
  const [clientsData, setClientsData] = useState<any>([]);
  const { startWatching } = useGeolocation();

  // 距離を整形する関数
  const formatDistance = (distance: number) => {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`; // 小数第一位まで表示
    }
    return `${Math.round(distance)} m`; // 小数点なしで表示
  };

  useEffect(() => {
    let subscription: any;

    const initialize = async () => {
      try {
        await startWatching();

        const clientData = await getAllClients();
        if (clientData) {
          setClientsData(clientData);
        } else {
        }

        // Supabase Realtime の監視を開始
        subscription = getRealTimeClients(() => {
          const updateClients = async () => {
            const updatedClientData = await getAllClients();
            if (updatedClientData) {
              setClientsData(updatedClientData);
            }
          };
          updateClients();
        });
      } catch (error) {
        console.error("🚨 Error in initialize:", error);
      }
    };

    initialize();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <div>
      {/* 参加者一覧 */}
      <div className="mt-3 ml-4 mr-4 space-y-2 overflow-y-auto h-[55vh] border-3 border-gray-100 rounded-2xl p-4">
          {clientsData.length > 0 ? (
            
            clientsData
            .sort((a: { id: any; }, b: { id: any; }) => (a.id ?? 0) - (b.id ?? 0)) 
            .map(
              (client: {
                id: number | null;
                name: string | null;
                icon: string | null;
                distance: number;
              }) => {
                // IDを基に色相を生成（0-360度）
                const hue = client.id ? ((client.id * 83) % 360 + (client.id * 157) % 180) % 360 : 0;
                return (
                  <div
                    key={client.id}
                    className="flex justify-between items-center px-6 py-3 rounded-4xl"
                    style={{
                      backgroundColor: "white",
                      fontFamily: "NicoMoji",
                      color: "#7d7d7d",
                      boxShadow: `8px 5px 4px hsla(${hue}, 80%, 80%, 0.2), 6px 3px 2px hsla(${hue}, 80%, 80%, 0.1)`,
                      border: `1px solid hsla(${hue}, 60%, 85%, 0.8)`
                    }}
                  >
                    <div className="flex items-center gap-">
                      <Image
                        src={client.icon || "/icons/user_default_icon.png"}
                        alt={`${client.name}のアイコン`}
                        width={45}
                        height={45}
                        className="rounded-full"
                      />
                      <span className="text-xl">{client.name}</span>
                    </div>
                    <div className="flex items-center text-xl">
                      <IoLocationOutline
                        size={24} 
                        color={`hsla(${hue}, 70%, 60%, 0.8)`} 
                        className="mr-3"
                      />
                      <span className="ml-1">{formatDistance(client.distance)}</span>
                    </div>
                  </div>
                );
              }
            )
          ) : (
            <div className="flex justify-center items-center h-[54vh] w-full">
              <p
                className="text-center text-xl "
                style={{ fontFamily: "NicoMoji", color: "#7d7d7d" }}
              >
                参加者がまだいません
              </p>
            </div>
          )}
        </div>
    </div>
  )
}

export default ShowClients
