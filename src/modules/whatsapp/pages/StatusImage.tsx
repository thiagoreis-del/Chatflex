import { useEffect, useRef } from "react";

export function StatusImage({
  photo,
  title,
  className,
}: {
  photo: Blob;
  title: string;
  className: string;
}) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(photo);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return <img ref={image} alt={title} className={className} />;
}
