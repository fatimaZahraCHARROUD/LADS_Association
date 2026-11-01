import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ImageOff } from "lucide-react";

const PREVIEW = 336;
const FALLBACK = "https://via.placeholder.com/150?text=No+Image";

export default function HoverImagePreview({
  src,
  alt = "",
  className = "w-20 aspect-square block rounded-lg object-cover border border-brand-border bg-gray-100",
}) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const positionPopup = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = r.right + 12;
    if (x + PREVIEW > vw - 16) x = r.left - PREVIEW - 12;
    if (x < 16) x = 16;

    let y = r.top + r.height / 2 - PREVIEW / 2;
    if (y + PREVIEW > vh - 16) y = vh - PREVIEW - 16;
    if (y < 16) y = 16;

    setCoords({ x, y });
  };

  const onEnter = () => {
    if (!src) return;
    positionPopup();
    setHovered(true);
  };

  const onLeave = () => setHovered(false);

  if (!src) {
    return (
      <div
        className={`${className} flex items-center justify-center text-gray-300`}
      >
        <ImageOff size={16} />
      </div>
    );
  }

  return (
    <>
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        className={`${className} cursor-zoom-in transition-transform hover:scale-105`}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK;
        }}
      />
      {createPortal(
        <AnimatePresence>
          {hovered && (
            <motion.div
              className="fixed z-[60] pointer-events-none"
              style={{ left: coords.x, top: coords.y }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
            >
              <img
                src={src}
                alt={alt}
                className="w-[336px] h-[336px] rounded-2xl object-cover shadow-2xl ring-4 ring-white bg-white"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK;
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
