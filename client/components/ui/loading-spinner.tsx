export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-none pixel-corners animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-none pixel-corners animate-spin"></div>
      </div>
      <p className="text-primary pixel-font text-sm animate-pulse">LOADING SYSTEM...</p>
    </div>
  );
}
