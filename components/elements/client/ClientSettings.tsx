"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoSettingsOutline } from "react-icons/io5";
import { RxCross1 } from "react-icons/rx";

const ClientSettings = (props: {
  showAltitude: boolean;
  setShowAltitude: (show: boolean) => void;
  distance: number;
}) => {
  const [showConfigModal, setConfigModal] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMounted = useRef(false); // マウント状態を記録

  useEffect(() => {
    isMounted.current = true; // コンポーネントがマウントされた

    return () => {
      isMounted.current = false; // アンマウント時にフラグをリセット
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return; // ページ遷移時の誤作動を防ぐ

    // すでに音が流れていたら停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // distance が 5m ～ 30m の間なら音を再生
    if (props.distance >= 5 && props.distance <= 30) {
      const audio = new Audio("/sonar.mp3");
      audio.volume = volume;
      audio.loop = true;
      audio.play();
      
      // audioRef を更新
      audioRef.current = audio;
    }
  }, [props.distance, volume]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const openConfigModal = () => {
    setConfigModal(true);
    document.body.style.overflow = "hidden";
  };

  const closeConfigModal = () => {
    setConfigModal(false);
    document.body.style.overflow = "auto";
  };

  return (
    <div>
      {/* 設定ボタン */}
      <motion.button
        whileTap={{ scale: 0.8, rotate: -45 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        onClick={openConfigModal}
        className="ml-15 px-3 py-3 rounded-4xl bg-white"
        style={{
          color: "#7d7d7d",
          fontFamily: "NicoMoji",
          boxShadow: "0 6px 3px #dee6ee",
          border: "none",
        }}
      >
        <IoSettingsOutline className="text-3xl text-gray-600" />
      </motion.button>

      <AnimatePresence>
        {showConfigModal && (
          <motion.div
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={closeConfigModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white p-8 rounded-lg relative w-[90%] max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileTap={{ scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                onClick={closeConfigModal}
                className="absolute top-3 right-3 text-4xl text-gray-400"
              >
                <RxCross1 className="text-gray-400 " />
              </motion.button>
              <p className="flex items-center justify-center font-semibold text-gray-600 text-2xl">
                設定
              </p>
              {/* 音量調整 */}
              <div className="flex mt-8">
                <p className="text-center text-xl text-gray-600 ml-5">音量</p>

                <input
                  type="range"
                  id="volume"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  style={{ fontFamily: "NicoMoji", color: "#7d7d7d" }}
                  className="ml-12"
                />
              </div>

              {/* 表示切り替えボタン */}
              <div className="mt-10 flex items-center justify-center space-x-4">
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                  }}
                  onClick={() => props.setShowAltitude(!props.showAltitude)}
                  style={{
                    backgroundColor: props.showAltitude ? "#ffffff" : "#f0f0f0",
                    fontFamily: "NicoMoji",
                    boxShadow: "0 2px 2px #dee6ee",
                    padding: "0.5rem 2rem",
                    border: "none",
                    borderRadius: "0.5rem",
                  }}
                  className="text-gray-600 text-xl text-semibold"
                >
                  高度の表示 {props.showAltitude ? "ON" : "OFF"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientSettings;
