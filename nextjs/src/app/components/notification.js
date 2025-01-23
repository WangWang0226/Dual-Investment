import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function Notification({ message, onClose }) {

    useEffect(() => {
        // 設置定時器，5 秒後自動關閉
        const timer = setTimeout(() => {
          onClose();
        }, 4000);
    
        // 清除定時器，避免內存洩漏
        return () => clearTimeout(timer);
      }, [onClose]);

    return (
        <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="notification-container"
        >
            <div className="notification-content">
                <button onClick={onClose} className="close-btn">X</button>
                <p className="text-xl">{message}</p>
            </div>
        </motion.div>
    );
}
