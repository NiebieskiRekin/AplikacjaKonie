import { useState } from "react";

export type Horse = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string | null;
  rodzajKonia: string;
  img_url: string | null;
  imageId: string | null;
};

type KonProps = {
  horse: Horse;
  setSelectedImage: (value: React.SetStateAction<string | null>) => void;
};

const default_img = "/horses/default.png";

function Kon({ horse, setSelectedImage }: KonProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <div
      className="cursor-pointer rounded-lg bg-white p-4 shadow-lg transition-transform duration-200 hover:scale-105"
      onClick={() => (window.location.href = `/konie/${horse.id}`)}
    >
      <div className="h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
        {!isImageLoaded && (
          <img
            src={default_img}
            alt="Loading..."
            className="inset-0 h-full w-full object-cover opacity-50 blur-xs transition-all duration-300"
          />
        )}
        <img
          src={horse.img_url || default_img}
          alt={horse.nazwa}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(e.currentTarget.src);
          }}
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.src = default_img;
            setIsImageLoaded(true);
          }}
          className={`inset-0 h-full w-full cursor-pointer object-cover transition-all duration-500 hover:scale-110 ${
            isImageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
      <div className="p-3">
        <h3 className="cursor-pointer text-xl font-bold text-green-900 hover:underline">
          {horse.nazwa}
        </h3>
      </div>
    </div>
  );
}

export default Kon;
