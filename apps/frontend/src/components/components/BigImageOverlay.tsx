import { IoMdCloseCircle } from "react-icons/io";

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
        className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black"
        onClick={() => setSelectedImage(null)}
      >
        <div className="relative w-full max-w-3xl">
          <button
            className="absolute top-4 right-4 rounded-full bg-red-500 px-4 py-2 text-2xl text-white"
            onClick={() => setSelectedImage(null)}
          >
            <IoMdCloseCircle />
          </button>
          <img
            src={selectedImage}
            alt="Powiększone zdjęcie"
            className="h-auto max-h-[90vh] w-full rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }
}

export default BigImageOverlay;
