import { XCircle } from "lucide-react";

type BigImageOverlayProps = {
  selectedImage: string | null;
  setSelectedImage: (value: React.SetStateAction<string | null>) => void;
};

function BigImageOverlay({
  selectedImage,
  setSelectedImage,
}: BigImageOverlayProps) {
  if (selectedImage) {
    return (
      <div
        className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative w-full max-w-3xl p-4">
          <button
            className="absolute top-6 right-6 z-50 rounded-full bg-red-600 p-1 text-white shadow-lg transition-colors hover:bg-red-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <XCircle size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Powiększone zdjęcie"
            className="h-auto max-h-[90vh] w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  }
  return null;
}

export default BigImageOverlay;
