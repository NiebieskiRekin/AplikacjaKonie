import { NavLink } from "react-router";

type Horse = {
  id: number;
  nazwa: string;
  numerPrzyzyciowy: string;
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
  return (
    <NavLink
      key={horse.id}
      className="cursor-pointer rounded-lg bg-white p-4 shadow-lg transition-transform duration-200 hover:scale-105"
      to={`/konie/${horse.id}`}
    >
      <img
        src={horse.img_url || default_img}
        alt={horse.nazwa}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedImage(e.currentTarget.src);
        }}
        onError={(e) => (e.currentTarget.src = default_img)}
        className="h-48 w-full cursor-pointer rounded-t-lg object-cover transition-transform duration-200 hover:scale-110"
      />
      <div className="p-3">
        <NavLink
          className="cursor-pointer text-xl font-bold text-green-900 hover:underline"
          to={`/konie/${horse.id}`}
        >
          {horse.nazwa}
        </NavLink>
      </div>
    </NavLink>
  );
}

export default Kon;
